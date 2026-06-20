import ldap3
import os
from database import db, Organization
from datetime import datetime

# LDAP Configuration
LDAP_SERVER = os.getenv('LDAP_SERVER', 'ldap://localhost:389')
LDAP_USER = os.getenv('LDAP_USER', 'cn=admin,dc=example,dc=com')
LDAP_PASSWORD = os.getenv('LDAP_PASSWORD', 'admin')
LDAP_SEARCH_BASE = os.getenv('LDAP_SEARCH_BASE', 'dc=example,dc=com')
LDAP_SEARCH_FILTER = os.getenv('LDAP_SEARCH_FILTER', '(objectClass=person)')

def searchmailNicknameKey(dn, conn):
    """Function to search for a given distinguishedName"""
    conn.search(search_base=LDAP_SEARCH_BASE,
                search_filter=f"(distinguishedName={dn})",
                search_scope=ldap3.SUBTREE,
                attributes=['displayName'])
    
    if conn.entries:
        return str(conn.entries[0].displayName.value) if hasattr(conn.entries[0], 'displayName') else ''
    return ''

def sync_ldap_to_database():
    """Enhanced LDAP sync function with comprehensive attribute mapping"""
    try:
        # Create LDAP server and connection
        server = ldap3.Server(LDAP_SERVER)
        conn = ldap3.Connection(server, user=LDAP_USER, password=LDAP_PASSWORD, auto_bind=True)
        
        # Perform the initial search with all required attributes
        conn.search(search_base=LDAP_SEARCH_BASE,
                    search_filter=LDAP_SEARCH_FILTER,
                    search_scope=ldap3.SUBTREE,
                    attributes=['mailNickname', 'directReports', 'givenName', 'displayName', 
                              'employeeID', 'title', 'manager', 'memberOf', 'mail', 
                              'company', 'co', 'c', 'cn'])
        
        entries = conn.entries
        directory = {}
        updated_count = 0
        inserted_count = 0
        
        # Process each entry
        for entry in entries:
            # Extract LDAP attributes with proper null handling
            mailNickname = entry.mailNickname.value if hasattr(entry, 'mailNickname') and entry.mailNickname.value else ''
            directReports = entry.directReports.value if hasattr(entry, 'directReports') and entry.directReports.value else []
            displayName = entry.displayName.value if hasattr(entry, 'displayName') and entry.displayName.value else ''
            employeeID = entry.employeeID.value if hasattr(entry, 'employeeID') and entry.employeeID.value else ''
            title = entry.title.value if hasattr(entry, 'title') and entry.title.value else ''
            manager = entry.manager.value if hasattr(entry, 'manager') and entry.manager.value else ''
            givenName = entry.givenName.value if hasattr(entry, 'givenName') and entry.givenName.value else ''
            memberOf = entry.memberOf.value if hasattr(entry, 'memberOf') and entry.memberOf.value else []
            mail = entry.mail.value if hasattr(entry, 'mail') and entry.mail.value else ''
            company = entry.company.value if hasattr(entry, 'company') and entry.company.value else ''
            co = entry.co.value if hasattr(entry, 'co') and entry.co.value else ''
            c = entry.c.value if hasattr(entry, 'c') and entry.c.value else ''
            cn = entry.cn.value if hasattr(entry, 'cn') and entry.cn.value else ''
            
            # Store in directory for reference
            directory[entry.entry_dn] = {
                'mailNickname': mailNickname,
                'displayName': displayName,
                'employeeID': employeeID,
                'title': title,
                'directReports': directReports if isinstance(directReports, list) else [directReports] if directReports else [],
                'manager': manager,
                'givenName': givenName,
                'memberOf': memberOf if isinstance(memberOf, list) else [memberOf] if memberOf else [],
                'mail': mail,
                'company': company,
                'co': co,
                'c': c,
                'cn': cn
            }
            
            # Check if employee exists in database
            staff_id = str(employeeID) if employeeID else ''
            existing = Organization.query.filter_by(staff_id=staff_id).first()
            
            # Resolve manager name if manager DN is provided
            manager_name = ''
            if manager:
                try:
                    manager_name = searchmailNicknameKey(manager, conn)
                except:
                    manager_name = manager  # Fallback to the DN if search fails
            
            # Map LDAP attributes to database fields
            employee_data = {
                'staff_id': staff_id,
                'staff_name': displayName or cn or givenName,
                'reporting_manager_name': manager_name,
                'job_function': title,
                'rank': '',  # Not available in LDAP, keep empty
                'squad_1': '',  # Not available in LDAP, keep empty
                'sub_platform': '',  # Not available in LDAP, keep empty
                'work_location': co or c,  # Use country code
                'company_short_name': company,
                'tech_skills': '',  # Not available in LDAP, keep empty
                'domain_knowledge': ', '.join(memberOf) if memberOf else '',  # Use memberOf groups
                'email': mail
            }
            
            if existing:
                # Update existing record
                for key, value in employee_data.items():
                    if value:  # Only update if value is not empty
                        setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                # Insert new record
                new_employee = Organization(**employee_data)
                db.session.add(new_employee)
                inserted_count += 1
        
        # Commit all changes
        db.session.commit()
        conn.unbind()
        
        print(f"LDAP sync completed successfully!")
        print(f"Updated {updated_count} existing records")
        print(f"Inserted {inserted_count} new records")
        print(f"Total entries processed: {len(entries)}")
        
        return {
            'success': True,
            'updated': updated_count,
            'inserted': inserted_count,
            'total_processed': len(entries),
            'directory': directory
        }
        
    except Exception as e:
        print(f"Error during LDAP sync: {str(e)}")
        db.session.rollback()
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    # Initialize Flask app context if running standalone
    from flask import Flask
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///org_visualizer.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    
    with app.app_context():
        result = sync_ldap_to_database()
        print(f"Sync result: {result}")