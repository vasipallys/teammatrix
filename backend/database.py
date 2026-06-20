# database.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from cryptography.fernet import Fernet
import base64
import os

db = SQLAlchemy()

# Encryption key for sensitive data (in production, store securely)
ENCRYPTION_KEY = os.environ.get('DB_ENCRYPTION_KEY', Fernet.generate_key())


class Organization(db.Model):
    __tablename__ = 'organization'

    id = db.Column(db.Integer, primary_key=True)
    staff_name = db.Column(db.String(255), nullable=False)
    staff_id = db.Column(db.String(100), unique=True)
    reporting_manager_name = db.Column(db.String(255))
    job_function = db.Column(db.String(255))
    rank = db.Column(db.String(100))
    squad_1 = db.Column(db.String(255))
    sub_platform = db.Column(db.String(255))
    work_location = db.Column(db.String(255))
    company_short_name = db.Column(db.String(100))
    tech_skills = db.Column(db.Text)
    domain_knowledge = db.Column(db.Text)
    email = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'Staff Name': self.staff_name,
            'Staff Id': self.staff_id,
            'Reporting Manager Name': self.reporting_manager_name,
            'Job Function': self.job_function,
            'Rank': self.rank,
            'Squad 1 (where applicable)': self.squad_1,
            'Sub-platform': self.sub_platform,
            'Work Location': self.work_location,
            'Company Short Name': self.company_short_name,
            'Tech Skills (SQL, Java, React etc)': self.tech_skills,
            'Domain Knowledge (Equity, FX, Reg, Advisory etc)': self.domain_knowledge,
            'Email': self.email
        }

    @staticmethod
    def from_dict(data):
        return Organization(
            staff_name=data.get('Staff Name', ''),
            staff_id=data.get('Staff Id', ''),
            reporting_manager_name=data.get('Reporting Manager Name'),
            job_function=data.get('Job Function', ''),
            rank=data.get('Rank', ''),
            squad_1=data.get('Squad 1 (where applicable)', ''),
            sub_platform=data.get('Sub-platform', ''),
            work_location=data.get('Work Location', ''),
            company_short_name=data.get('Company Short Name', ''),
            tech_skills=data.get('Tech Skills (SQL, Java, React etc)', ''),
            domain_knowledge=data.get('Domain Knowledge (Equity, FX, Reg, Advisory etc)', ''),
            email=data.get('Email', '')
        )


class WorkPlan(db.Model):
    __tablename__ = 'work_plan'

    id = db.Column(db.Integer, primary_key=True)
    squad_name = db.Column(db.String(255), nullable=False)
    book_of_work = db.Column(db.String(255), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'Squad name': self.squad_name,
            'Book of work': self.book_of_work,
            'start date': self.start_date.isoformat() if self.start_date else None,
            'end date': self.end_date.isoformat() if self.end_date else None,
            'description if any': self.description
        }

    @staticmethod
    def from_dict(data):
        def parse_date(date_str):
            if not date_str:
                return None
            try:
                if 'T' in date_str:
                    return datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
                else:
                    return datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return None
        
        return WorkPlan(
            squad_name=data.get('Squad name', ''),
            book_of_work=data.get('Book of work', ''),
            start_date=parse_date(data.get('start date')),
            end_date=parse_date(data.get('end date')),
            description=data.get('description if any', '')
        )


class Repository(db.Model):
    __tablename__ = 'repository'

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    repo_type = db.Column(db.String(50), nullable=False)  # github, bitbucket, gitlab
    project_type = db.Column(db.String(100))  # spring-boot, react, angular, etc
    language = db.Column(db.String(100))
    url = db.Column(db.String(500))
    clone_url = db.Column(db.String(500))
    default_branch = db.Column(db.String(100), default='main')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = db.Column(db.DateTime)
    is_private = db.Column(db.Boolean, default=False)
    
    # Relationships
    pull_requests = db.relationship('PullRequest', backref='repository', lazy=True, cascade='all, delete-orphan')
    commits = db.relationship('Commit', backref='repository', lazy=True, cascade='all, delete-orphan')
    branches = db.relationship('Branch', backref='repository', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        # Calculate contributors from commits
        contributors = set()
        for commit in self.commits:
            if commit.author:
                contributors.add(commit.author)
        
        # Calculate language distribution (mock for now - would need real language analysis)
        languages = {}
        if self.language:
            languages[self.language] = 100.0
        
        # Calculate size (estimate from commits and files)
        size_kb = len(self.commits) * 10 + len(self.pull_requests) * 5  # Rough estimate
        
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'repo_name': self.name,  # Frontend compatibility
            'description': self.description,
            'repo_type': self.repo_type,
            'provider': self.repo_type,  # Frontend compatibility
            'project_type': self.project_type,
            'language': self.language,
            'primary_language': self.language,  # Frontend compatibility
            'languages': languages,
            'url': self.url,
            'clone_url': self.clone_url,
            'default_branch': self.default_branch,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'is_private': self.is_private,
            'is_active': True,  # Default active status
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'pull_request_count': len(self.pull_requests),
            'pr_count': len(self.pull_requests),  # Frontend compatibility
            'commit_count': len(self.commits),
            'branch_count': len(self.branches),
            'contributors': list(contributors),
            'size_kb': size_kb
        }


class PullRequest(db.Model):
    __tablename__ = 'pull_request'

    id = db.Column(db.Integer, primary_key=True)
    pr_id = db.Column(db.String(50), nullable=False)  # External PR ID
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    author = db.Column(db.String(255), nullable=False)
    author_email = db.Column(db.String(255))
    state = db.Column(db.String(50), nullable=False)  # open, merged, closed
    source_branch = db.Column(db.String(255))
    target_branch = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime)
    merged_at = db.Column(db.DateTime)
    closed_at = db.Column(db.DateTime)
    reviewers = db.Column(db.Text)  # JSON string of reviewers
    approvers = db.Column(db.Text)  # JSON string of approvers
    files_changed = db.Column(db.Integer, default=0)
    lines_added = db.Column(db.Integer, default=0)
    lines_deleted = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'pr_id': self.pr_id,
            'repository_id': self.repository_id,
            'title': self.title,
            'description': self.description,
            'author': self.author,
            'author_id': self.author,  # Frontend compatibility
            'author_email': self.author_email,
            'state': self.state,
            'source_branch': self.source_branch,
            'target_branch': self.target_branch,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_date': self.created_at.isoformat() if self.created_at else None,  # Frontend compatibility
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'merged_at': self.merged_at.isoformat() if self.merged_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'reviewers': json.loads(self.reviewers) if self.reviewers else [],
            'approvers': json.loads(self.approvers) if self.approvers else [],
            'files_changed': self.files_changed,
            'lines_added': self.lines_added,
            'lines_deleted': self.lines_deleted,
            'comments_count': self.comments_count,
            'commits_count': 1  # Default value - would need actual commit counting
        }


class Commit(db.Model):
    __tablename__ = 'commits'

    id = db.Column(db.Integer, primary_key=True)
    commit_hash = db.Column(db.String(40), nullable=False)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    author = db.Column(db.String(255), nullable=False)
    author_email = db.Column(db.String(255))
    committer = db.Column(db.String(255))
    committer_email = db.Column(db.String(255))
    message = db.Column(db.Text, nullable=False)
    branch = db.Column(db.String(255))
    committed_at = db.Column(db.DateTime, nullable=False)
    files_changed = db.Column(db.Integer, default=0)
    lines_added = db.Column(db.Integer, default=0)
    lines_deleted = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'commit_hash': self.commit_hash,
            'repository_id': self.repository_id,
            'author': self.author,
            'author_name': self.author,  # Frontend compatibility
            'author_email': self.author_email,
            'committer': self.committer,
            'committer_email': self.committer_email,
            'message': self.message,
            'branch': self.branch,
            'committed_at': self.committed_at.isoformat() if self.committed_at else None,
            'commit_date': self.committed_at.isoformat() if self.committed_at else None,  # Frontend compatibility
            'files_changed': self.files_changed,
            'lines_added': self.lines_added,
            'lines_deleted': self.lines_deleted
        }


class Branch(db.Model):
    __tablename__ = 'branch'

    id = db.Column(db.Integer, primary_key=True)
    repository_id = db.Column(db.Integer, db.ForeignKey('repository.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    last_commit_hash = db.Column(db.String(40))
    last_commit_date = db.Column(db.DateTime)
    ahead_count = db.Column(db.Integer, default=0)
    behind_count = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'repository_id': self.repository_id,
            'name': self.name,
            'is_default': self.is_default,
            'last_commit_hash': self.last_commit_hash,
            'last_commit_date': self.last_commit_date.isoformat() if self.last_commit_date else None,
            'ahead_count': self.ahead_count,
            'behind_count': self.behind_count
        }


class IntegrationConfig(db.Model):
    __tablename__ = 'integration_config'
    
    id = db.Column(db.Integer, primary_key=True)
    integration_type = db.Column(db.String(50), nullable=False)  # 'jira', 'ldap', 'git'
    config_name = db.Column(db.String(100), nullable=False)
    server_url = db.Column(db.String(500))
    username = db.Column(db.String(255))
    encrypted_credentials = db.Column(db.Text)  # Encrypted password/token
    additional_config = db.Column(db.Text)  # JSON for extra settings
    is_active = db.Column(db.Boolean, default=True)
    last_tested = db.Column(db.DateTime)
    test_result = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def encrypt_credentials(self, credentials):
        """Encrypt sensitive credentials"""
        try:
            fernet = Fernet(ENCRYPTION_KEY)
            encrypted_data = fernet.encrypt(credentials.encode())
            self.encrypted_credentials = base64.b64encode(encrypted_data).decode()
        except Exception as e:
            raise Exception(f"Failed to encrypt credentials: {str(e)}")
    
    def decrypt_credentials(self):
        """Decrypt sensitive credentials"""
        try:
            if not self.encrypted_credentials:
                return None
            fernet = Fernet(ENCRYPTION_KEY)
            encrypted_data = base64.b64decode(self.encrypted_credentials.encode())
            return fernet.decrypt(encrypted_data).decode()
        except Exception as e:
            raise Exception(f"Failed to decrypt credentials: {str(e)}")
    
    def to_dict(self, include_credentials=False):
        result = {
            'id': self.id,
            'integration_type': self.integration_type,
            'config_name': self.config_name,
            'server_url': self.server_url,
            'username': self.username,
            'additional_config': json.loads(self.additional_config) if self.additional_config else {},
            'is_active': self.is_active,
            'last_tested': self.last_tested.isoformat() if self.last_tested else None,
            'test_result': self.test_result,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
        
        if include_credentials:
            result['credentials'] = self.decrypt_credentials()
        
        return result
    
    @staticmethod
    def get_active_config(integration_type):
        """Get the active configuration for an integration type"""
        return IntegrationConfig.query.filter_by(
            integration_type=integration_type,
            is_active=True
        ).first()
    
    def test_connection_and_update(self, test_function):
        """Test connection and update the result"""
        try:
            result = test_function(self)
            self.last_tested = datetime.utcnow()
            self.test_result = json.dumps(result)
            db.session.commit()
            return result
        except Exception as e:
            self.test_result = json.dumps({'success': False, 'error': str(e)})
            db.session.commit()
            raise