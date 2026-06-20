#!/usr/bin/env python3
"""
Create sample Git repository data for testing
"""

import os
import sys
from datetime import datetime, timedelta
import random

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from database import Repository, Commit, PullRequest, Branch

def create_sample_repositories():
    """Create sample repositories with realistic data"""
    
    sample_repos = [
        {
            'name': 'TeamMatrix Frontend',
            'slug': 'teammatrix-frontend',
            'repo_type': 'github',
            'project_type': 'react',
            'language': 'TypeScript',
            'url': 'https://github.com/company/teammatrix-frontend',
            'clone_url': 'https://github.com/company/teammatrix-frontend.git',
            'default_branch': 'main',
            'description': 'React frontend for TeamMatrix application'
        },
        {
            'name': 'TeamMatrix Backend',
            'slug': 'teammatrix-backend',
            'repo_type': 'github',
            'project_type': 'flask',
            'language': 'Python',
            'url': 'https://github.com/company/teammatrix-backend',
            'clone_url': 'https://github.com/company/teammatrix-backend.git',
            'default_branch': 'main',
            'description': 'Flask backend API for TeamMatrix application'
        },
        {
            'name': 'Analytics Service',
            'slug': 'analytics-service',
            'repo_type': 'gitlab',
            'project_type': 'microservice',
            'language': 'Java',
            'url': 'https://gitlab.com/company/analytics-service',
            'clone_url': 'https://gitlab.com/company/analytics-service.git',
            'default_branch': 'master',
            'description': 'Microservice for handling analytics and reporting'
        }
    ]
    
    repositories = []
    for repo_data in sample_repos:
        repo = Repository(
            name=repo_data['name'],
            slug=repo_data['slug'],
            repo_type=repo_data['repo_type'],
            project_type=repo_data['project_type'],
            language=repo_data['language'],
            url=repo_data['url'],
            clone_url=repo_data['clone_url'],
            default_branch=repo_data['default_branch'],
            description=repo_data['description'],
            last_activity=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            is_private=False
        )
        repositories.append(repo)
        db.session.add(repo)
    
    db.session.commit()
    return repositories

def create_sample_commits(repositories):
    """Create sample commits for repositories"""
    
    authors = [
        'John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emma Davis',
        'Alex Brown', 'Lisa Chen', 'David Garcia', 'Anna Rodriguez'
    ]
    
    commit_messages = [
        'Add new feature for user authentication',
        'Fix bug in data processing pipeline',
        'Update dependencies and security patches',
        'Refactor code for better performance',
        'Add unit tests for core functionality',
        'Update documentation and README',
        'Fix memory leak in background service',
        'Implement new API endpoints',
        'Update UI components and styling',
        'Add error handling and logging'
    ]
    
    for repo in repositories:
        # Create 15-50 commits per repository
        num_commits = random.randint(15, 50)
        
        for i in range(num_commits):
            commit = Commit(
                commit_hash=f"{''.join(random.choices('0123456789abcdef', k=40))}",
                repository_id=repo.id,
                author=random.choice(authors),
                author_email=f"{random.choice(authors).lower().replace(' ', '.')}@company.com",
                committer=random.choice(authors),
                committer_email=f"{random.choice(authors).lower().replace(' ', '.')}@company.com",
                message=random.choice(commit_messages),
                branch=random.choice(['main', 'develop', 'feature/new-feature', 'bugfix/critical-fix']),
                committed_at=datetime.utcnow() - timedelta(days=random.randint(1, 365)),
                files_changed=random.randint(1, 15),
                lines_added=random.randint(5, 200),
                lines_deleted=random.randint(0, 100)
            )
            db.session.add(commit)
    
    db.session.commit()

def create_sample_pull_requests(repositories):
    """Create sample pull requests for repositories"""
    
    authors = [
        'John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emma Davis',
        'Alex Brown', 'Lisa Chen', 'David Garcia', 'Anna Rodriguez'
    ]
    
    pr_titles = [
        'Feature: Add user dashboard analytics',
        'Fix: Resolve memory leak in data processing',
        'Update: Migrate to new authentication system',
        'Refactor: Improve code organization and readability',
        'Feature: Implement real-time notifications',
        'Fix: Correct timezone handling in reports',
        'Update: Upgrade React and dependencies',
        'Feature: Add export functionality',
        'Fix: Handle edge cases in data validation',
        'Refactor: Extract common utilities'
    ]
    
    states = ['open', 'merged', 'closed']
    state_weights = [0.2, 0.6, 0.2]  # More merged than open/closed
    
    for repo in repositories:
        # Create 5-15 PRs per repository
        num_prs = random.randint(5, 15)
        
        for i in range(num_prs):
            state = random.choices(states, weights=state_weights)[0]
            created_at = datetime.utcnow() - timedelta(days=random.randint(1, 180))
            
            pr = PullRequest(
                pr_id=f"PR-{repo.id}-{i+1}",
                repository_id=repo.id,
                title=random.choice(pr_titles),
                description=f"This pull request implements {random.choice(['new functionality', 'bug fixes', 'improvements', 'refactoring'])} for the {repo.name.lower()}.",
                author=random.choice(authors),
                author_email=f"{random.choice(authors).lower().replace(' ', '.')}@company.com",
                state=state,
                source_branch=f"feature/branch-{i+1}",
                target_branch=repo.default_branch,
                created_at=created_at,
                updated_at=created_at + timedelta(hours=random.randint(1, 72)),
                merged_at=created_at + timedelta(hours=random.randint(24, 168)) if state == 'merged' else None,
                closed_at=created_at + timedelta(hours=random.randint(1, 168)) if state == 'closed' else None,
                files_changed=random.randint(2, 20),
                lines_added=random.randint(20, 500),
                lines_deleted=random.randint(5, 200),
                comments_count=random.randint(0, 15)
            )
            db.session.add(pr)
    
    db.session.commit()

def create_sample_branches(repositories):
    """Create sample branches for repositories"""
    
    branch_names = [
        'main', 'develop', 'staging', 'feature/user-auth', 
        'feature/analytics', 'bugfix/memory-leak', 'release/v2.1.0',
        'feature/notifications', 'hotfix/security-patch'
    ]
    
    for repo in repositories:
        # Create 3-8 branches per repository
        num_branches = random.randint(3, 8)
        selected_branches = random.sample(branch_names, min(num_branches, len(branch_names)))
        
        for i, branch_name in enumerate(selected_branches):
            is_default = (branch_name == repo.default_branch)
            
            branch = Branch(
                repository_id=repo.id,
                name=branch_name,
                is_default=is_default,
                last_commit_hash=f"{''.join(random.choices('0123456789abcdef', k=40))}",
                last_commit_date=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                ahead_count=0 if is_default else random.randint(0, 10),
                behind_count=0 if is_default else random.randint(0, 5)
            )
            db.session.add(branch)
    
    db.session.commit()

def main():
    """Create all sample data"""
    with app.app_context():
        print("Creating sample Git repository data...")
        
        # Clear existing data
        Branch.query.delete()
        PullRequest.query.delete()
        Commit.query.delete()
        Repository.query.delete()
        db.session.commit()
        
        # Create sample data
        print("Creating repositories...")
        repositories = create_sample_repositories()
        
        print("Creating commits...")
        create_sample_commits(repositories)
        
        print("Creating pull requests...")
        create_sample_pull_requests(repositories)
        
        print("Creating branches...")
        create_sample_branches(repositories)
        
        print(f"✅ Created sample data:")
        print(f"   - {len(repositories)} repositories")
        print(f"   - {Commit.query.count()} commits")
        print(f"   - {PullRequest.query.count()} pull requests")
        print(f"   - {Branch.query.count()} branches")

if __name__ == '__main__':
    main()