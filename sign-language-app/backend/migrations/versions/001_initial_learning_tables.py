"""Initial migration - Create learning module tables

Revision ID: 001_initial_learning_tables
Revises: 
Create Date: 2026-04-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '001_initial_learning_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create lessons table
    op.create_table(
        'lessons',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('level', sa.String(20), nullable=False, server_default='beginner'),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices for lessons
    op.create_index(op.f('ix_lessons_title'), 'lessons', ['title'])
    op.create_index(op.f('ix_lessons_level'), 'lessons', ['level'])
    op.create_index(op.f('ix_lessons_is_active'), 'lessons', ['is_active'])

    # Create vocabularies table
    op.create_table(
        'vocabularies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('word', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('example_sentence', sa.String(500), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('pronunciation', sa.String(255), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices for vocabularies
    op.create_index(op.f('ix_vocabularies_lesson_id'), 'vocabularies', ['lesson_id'])
    op.create_index(op.f('ix_vocabularies_word'), 'vocabularies', ['word'])

    # Create quizzes table
    op.create_table(
        'quizzes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('passing_score', sa.Integer(), nullable=False, server_default='70'),
        sa.Column('time_limit', sa.Integer(), nullable=False, server_default='300'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices for quizzes
    op.create_index(op.f('ix_quizzes_lesson_id'), 'quizzes', ['lesson_id'])

    # Create quiz_questions table
    op.create_table(
        'quiz_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('quiz_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(20), nullable=False, server_default='multiple_choice'),
        sa.Column('option_a', sa.String(500), nullable=True),
        sa.Column('option_b', sa.String(500), nullable=True),
        sa.Column('option_c', sa.String(500), nullable=True),
        sa.Column('option_d', sa.String(500), nullable=True),
        sa.Column('correct_answer', sa.String(50), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices for quiz_questions
    op.create_index(op.f('ix_quiz_questions_quiz_id'), 'quiz_questions', ['quiz_id'])

    # Create user_progress table
    op.create_table(
        'user_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('time_spent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_accessed', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices for user_progress
    op.create_index(op.f('ix_user_progress_user_id'), 'user_progress', ['user_id'])
    op.create_index(op.f('ix_user_progress_lesson_id'), 'user_progress', ['lesson_id'])

    # Create user_quiz_results table
    op.create_table(
        'user_quiz_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quiz_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('total_questions', sa.Integer(), nullable=False),
        sa.Column('correct_answers', sa.Integer(), nullable=False),
        sa.Column('time_taken', sa.Integer(), nullable=False),
        sa.Column('is_passed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('answers', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indices for user_quiz_results
    op.create_index(op.f('ix_user_quiz_results_user_id'), 'user_quiz_results', ['user_id'])
    op.create_index(op.f('ix_user_quiz_results_quiz_id'), 'user_quiz_results', ['quiz_id'])


def downgrade() -> None:
    # Drop indices
    op.drop_index(op.f('ix_user_quiz_results_quiz_id'), table_name='user_quiz_results')
    op.drop_index(op.f('ix_user_quiz_results_user_id'), table_name='user_quiz_results')
    op.drop_index(op.f('ix_user_progress_lesson_id'), table_name='user_progress')
    op.drop_index(op.f('ix_user_progress_user_id'), table_name='user_progress')
    op.drop_index(op.f('ix_quiz_questions_quiz_id'), table_name='quiz_questions')
    op.drop_index(op.f('ix_quizzes_lesson_id'), table_name='quizzes')
    op.drop_index(op.f('ix_vocabularies_word'), table_name='vocabularies')
    op.drop_index(op.f('ix_vocabularies_lesson_id'), table_name='vocabularies')
    op.drop_index(op.f('ix_lessons_is_active'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_level'), table_name='lessons')
    op.drop_index(op.f('ix_lessons_title'), table_name='lessons')
    
    # Drop tables
    op.drop_table('user_quiz_results')
    op.drop_table('user_progress')
    op.drop_table('quiz_questions')
    op.drop_table('quizzes')
    op.drop_table('vocabularies')
    op.drop_table('lessons')
