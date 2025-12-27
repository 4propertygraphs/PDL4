----------------------------------------------------------------------
How to Start the Backend
----------------------------------------------------------------------

1. **Install Dependencies**:
   Make sure you have Python and `pip` installed. Then, install all required packages by running:
   ```
   pip install -r Models/requirements.txt
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env`.
   - For Supabase, set `SQLALCHEMY_DATABASE_URI` to your project’s Postgres connection string, for example  
     `postgresql+psycopg2://<db_user>:<db_password>@<project>.supabase.co:5432/<db_name>?sslmode=require`.
   - The app still works with a local MySQL instance by supplying the old MySQL URI instead.

3. **Run the Application** (from the `Models` directory):
   Start the Flask application by running:
   ```
   py App.py
   ```

The backend will be available at `http://localhost:5000`.
