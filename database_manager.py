import mariadb
import os

def with_db_connection(func):
    def wrapper(self, *args, **kwargs):
        try:
            conn = mariadb.connect(**self.db_config)
            cur = conn.cursor()
            result = func(self, cur, *args, **kwargs)
            conn.commit()
            return result
        except mariadb.Error as e:
            print(f"Error: {e}")
            conn.rollback() 
            return  False
        finally:
            if 'cur' in locals():
                cur.close()
            if 'conn' in locals():
                conn.close()
    return wrapper

class DatabaseManager:
    def __init__(self):
        self.db_config = {
            'host': os.getenv('DB_HOST'),
            'port': int(os.getenv("DB_PORT")),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': 'cctest',
            'read_timeout': 300,
            'write_timeout': 300,
            'connect_timeout': 300
        }

    @with_db_connection
    def get_businesses(self, cur):
        cur.execute("SELECT id, name FROM business")
        businesses = {}
        for row in cur.fetchall():
            businesses[row[1]] = row[0]
        return businesses

    @with_db_connection
    def get_all_plan_ids(self, cur, last_modified=None):
        query = "SELECT plan_id FROM plans"
        params = []
        if last_modified:
            query += " WHERE last_modified > %s"
            params.append(last_modified)
        
        cur.execute(query, tuple(params))

        return [row[0] for row in cur.fetchall()]

    @with_db_connection
    def get_plan(self, cur, plan_ids):
        placeholders = ', '.join(['%s'] * len(plan_ids))
        cur.execute(f"""
        SELECT p.plan_id, p.name, p.contract, b.name business, p.fee, p.discount, p.note
        FROM plans p
        INNER JOIN business b ON p.business_id = b.id
        WHERE plan_id IN ({placeholders})""", tuple(plan_ids))
        result = cur.fetchall()
        return result

    @with_db_connection
    def remove_plan(self, cur, plan_id):
        try:
            cur.execute("DELETE FROM plans WHERE plan_id=%s", (plan_id,))
            return True
        except mariadb.Error as e:
            print(f"Error deleting plan: {e}")
            return False

    @with_db_connection
    def insert_plan(self, cur, plans):
        try:
            cur.executemany(
                "INSERT INTO plans (plan_id, name, contract, business_id, fee, discount, note) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                [(plan['plan_id'], plan['name'], plan['contract'], plan['business_id'], plan['fee'], plan['discount'], plan['note']) for plan in plans]
            )
            return True
        except mariadb.Error as e:
            print(f"Error inserting plans: {e}")
            return False

    @with_db_connection
    def update_plan(self, cur, plans):
        try:
            cur.executemany(
                """
                INSERT INTO plans (plan_id, name, contract, business_id, fee, discount, note)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    contract = VALUES(contract),
                    business_id = VALUES(business_id),
                    fee = VALUES(fee),
                    discount = VALUES(discount),
                    note = VALUES(note),
                    last_modified = NOW()
                """,
                [(plan['plan_id'], plan['name'], plan['contract'], plan['business_id'], plan['fee'], plan['discount'], plan['note']) for plan in plans]
            )
            return True
        except mariadb.Error as e:
            print(f"Error updating plans: {e}")
            return False

    @with_db_connection
    def get_unexpired_reminders(self, cur, last_modified=None):
        query = """
            SELECT id, title, content, market, start_date, expire_date, recurrent_interval, is_global, is_all_business
            FROM reminders
            WHERE expire_date > NOW()
        """
        params = []
        if last_modified:
            query += " AND last_modified > %s"
            params.append(last_modified)

        cur.execute(query, tuple(params))
        column_names = [desc[0] for desc in cur.description]
        return [dict(zip(column_names, row)) for row in cur.fetchall()]

    @with_db_connection
    def get_acct_reminder_status(self, cur, last_modified=None, reminder_id=None):
        query = """
            SELECT ar.acct_id, ar.reminder_id, ar.is_processed, ar.last_processed_at
            FROM acct_reminders ar
            JOIN reminders r ON ar.reminder_id = r.id
            WHERE r.expire_date > NOW()
        """
        params = []
        if last_modified:
            query += " AND ar.last_processed_at > %s"
            params.append(last_modified)
        if reminder_id:
            query += " AND ar.reminder_id = %s"
            params.append(reminder_id)
        cur.execute(query, tuple(params))
        column_names = [desc[0] for desc in cur.description]
        return [dict(zip(column_names, row)) for row in cur.fetchall()]

    # Internal method without decorator, expects cursor
    def _get_business_ids_for_reminders(self, cur, reminder_ids):
        if not reminder_ids: # Avoid empty IN clause
             return {}
        placeholders = ', '.join(['%s'] * len(reminder_ids))
        cur.execute(f"""
            SELECT reminder_id, business_id
            FROM reminder_to_business
            WHERE reminder_id IN ({placeholders})
        """, tuple(reminder_ids))

        result = {}
        for row in cur.fetchall():
          reminder_id = row[0]
          if reminder_id not in result:
            result[reminder_id] = []
          result[reminder_id].append(row[1])
        return result

    @with_db_connection
    def get_business_ids_for_reminders(self, cur, reminder_ids):
        """Public method to get business IDs. Manages connection/cursor via decorator."""
        # Calls the internal method, passing the cursor from the decorator
        return self._get_business_ids_for_reminders(cur, reminder_ids)

    @with_db_connection
    def get_reminders_by_acct(self, cur, acct_id):
        cur.execute("""
            SELECT r.id, r.title, r.content, r.market, r.start_date, r.expire_date, r.recurrent_interval
            FROM reminders r
            JOIN acct_reminders ar ON r.id = ar.reminder_id
            WHERE ar.acct_id = %s AND r.is_global = FALSE AND r.expire_date > NOW()
        """, (acct_id,))
        column_names = [desc[0] for desc in cur.description]
        return [dict(zip(column_names, row)) for row in cur.fetchall()]

    @with_db_connection
    def get_accts_by_reminder(self, cur, reminder_id):
        cur.execute("SELECT acct_id FROM acct_reminders WHERE reminder_id = %s", (reminder_id,))
        return [row[0] for row in cur.fetchall()]

    @with_db_connection
    def get_reminder_by_id(self, cur, reminder_id):
        """Gets a single reminder by its ID."""
        cur.execute("""
            SELECT id, title, content, market, start_date, expire_date, recurrent_interval, is_global, is_all_business, create_date, last_modified
            FROM reminders
            WHERE id = %s
        """, (reminder_id,))
        column_names = [desc[0] for desc in cur.description]
        row = cur.fetchone()
        if not row:
            return None

        reminder_dict = dict(zip(column_names, row))
        # Call internal method with existing cursor from this method's decorator
        business_ids_map = self._get_business_ids_for_reminders(cur, [reminder_id])
        reminder_dict['business_ids'] = business_ids_map.get(reminder_id, [])
        return reminder_dict

    @with_db_connection
    def get_reminders_by_create_date(self, cur, start_date, end_date):
        """Gets reminders created within a specific date range."""
        cur.execute("""
            SELECT id, title, content, market, start_date, expire_date, recurrent_interval, is_global, is_all_business, create_date, last_modified
            FROM reminders
            WHERE create_date BETWEEN %s AND %s
            ORDER BY create_date
        """, (start_date, end_date))
        column_names = [desc[0] for desc in cur.description]
        reminders = [dict(zip(column_names, row)) for row in cur.fetchall()]

        if not reminders:
            return []

        reminder_ids = [r['id'] for r in reminders]
        # Call internal method with existing cursor from this method's decorator
        business_ids_map = self._get_business_ids_for_reminders(cur, reminder_ids)

        for reminder in reminders:
            reminder['business_ids'] = business_ids_map.get(reminder['id'], [])

        return reminders

    @with_db_connection
    def get_reminders_by_title(self, cur, title_pattern):
        """Gets reminders with titles matching a pattern (case-insensitive)."""
        search_pattern = f"%{title_pattern}%"
        cur.execute("""
            SELECT id, title, content, market, start_date, expire_date, recurrent_interval, is_global, is_all_business, create_date, last_modified
            FROM reminders
            WHERE title LIKE %s
            ORDER BY title
        """, (search_pattern,))
        column_names = [desc[0] for desc in cur.description]
        reminders = [dict(zip(column_names, row)) for row in cur.fetchall()]

        if not reminders:
            return []

        reminder_ids = [r['id'] for r in reminders]
        # Call internal method with existing cursor from this method's decorator
        business_ids_map = self._get_business_ids_for_reminders(cur, reminder_ids)

        for reminder in reminders:
            reminder['business_ids'] = business_ids_map.get(reminder['id'], [])

        return reminders

    @with_db_connection
    def insert_reminder(self, cur, reminder):
        try:
            # Convert market list to comma-separated string for DB SET type
            market_list = reminder.get('market', [])
            market_str = ','.join(market_list)
            if not market_str:
                market_str = 'USCN,CACN' # Default as per validation logic

            cur.execute("""
                INSERT INTO reminders (id, title, content, market, start_date, expire_date, recurrent_interval, is_global, is_all_business)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    content = VALUES(content),
                    market = VALUES(market),
                    start_date = VALUES(start_date),
                    expire_date = VALUES(expire_date),
                    recurrent_interval = VALUES(recurrent_interval),
                    is_global = VALUES(is_global),
                    is_all_business = VALUES(is_all_business)
            """, (reminder.get('id'), reminder['title'], reminder['content'],
                  market_str,
                  reminder.get('start_date'),
                  reminder.get('expire_date'),
                  reminder.get('recurrent_interval'), reminder['is_global'],
                  reminder.get('is_all_business')))

            reminder_id = reminder.get('id') or cur.lastrowid

            # Handle acct_reminders if is_global is False
            if not reminder['is_global']:
                cur.execute("DELETE FROM acct_reminders WHERE reminder_id = %s", (reminder_id,))
                cur.executemany("INSERT INTO acct_reminders (acct_id, reminder_id) VALUES (%s, %s)",
                    [(acct_id, reminder_id) for acct_id in reminder['acct']])

            # Handle reminder_to_business if is_global is True and is_all_business is False
            if reminder['is_global'] and not reminder.get('is_all_business', False):
                cur.execute("DELETE FROM reminder_to_business WHERE reminder_id = %s", (reminder_id,))
                cur.executemany("INSERT INTO reminder_to_business (reminder_id, business_id) VALUES (%s, %s)",
                    [(reminder_id, business_id) for business_id in reminder['business_ids']])
            return reminder_id

        except mariadb.Error as e:
            print(f"Error inserting reminder: {e}")
            return False

    @with_db_connection
    def insert_reminder_op(self, cur, op):
        try:
            cur.execute("""
                INSERT INTO acct_reminders (acct_id, reminder_id, is_processed, last_processed_at)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    is_processed = VALUES(is_processed),
                    last_processed_at = VALUES(last_processed_at)
            """, (op.get('acct_id'), op.get('reminder_id'), op.get('is_processed'), op.get('last_processed_at')))
            return True
        except mariadb.Error as e:
            print(f"Error inserting/updating acct_reminder: {e}")
            return False

    @with_db_connection
    def insert_process_log(self, cur, op):
        try:
            cur.execute("""
                INSERT INTO reminder_process_log (acct_id, reminder_id, processed_by, processed_by_xf, processed_at, new_status)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (op.get('acct_id'), op.get('reminder_id'), op.get('processed_by'), op.get('processed_by_xf'), op.get('processed_at'), op.get('is_processed')))
            return True
        except mariadb.Error as e:
            print(f"Error inserting into reminder_process_log: {e}")
            return False

    @with_db_connection
    def delete_reminder(self, cur, reminder_id):
        try:
            cur.execute("DELETE FROM acct_reminders WHERE reminder_id = %s", (reminder_id,))

            cur.execute("DELETE FROM reminder_process_log WHERE reminder_id = %s", (reminder_id,))

            # reminder_to_business entries are deleted automatically due to ON DELETE CASCADE.
            cur.execute("DELETE FROM reminders WHERE id = %s", (reminder_id,))
            return True
        except mariadb.Error as e:
            print(f"Error deleting reminder: {e}")
            return False
        
    @with_db_connection
    def get_reminder_log(self, cur, reminder_id):
        cur.execute("""
            SELECT acct_id, reminder_id, processed_by, processed_by_xf, processed_at, new_status
            FROM reminder_process_log
            WHERE reminder_id = %s
        """, (reminder_id,))
        
        column_names = [desc[0] for desc in cur.description]
        reminder_log = [dict(zip(column_names, row)) for row in cur.fetchall()]

        return reminder_log

    @with_db_connection
    def get_all_acct_reminder_status(self, cur, reminder_id):
        cur.execute("""
            SELECT acct_id, reminder_id, is_processed, last_processed_at
            FROM acct_reminders
            WHERE reminder_id = %s
        """, (reminder_id,))

        column_names = [desc[0] for desc in cur.description]
        acct_rem_status = [dict(zip(column_names, row)) for row in cur.fetchall()]

        return acct_rem_status
