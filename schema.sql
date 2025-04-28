USE cctest;

CREATE TABLE IF NOT EXISTS plans (
    plan_id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contract VARCHAR(64),
    business_id TINYINT UNSIGNED NOT NULL,
    fee VARCHAR(255),
    discount VARCHAR(255),
    note TEXT,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES business(id)
);

CREATE TABLE IF NOT EXISTS reminders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(255) NOT NULL,
    market SET('USCN', 'CACN') NOT NULL,
    start_date DATETIME,
    expire_date DATETIME,
    recurrent_interval INT DEFAULT -1,
    is_global BOOLEAN NOT NULL,
    is_all_business BOOLEAN,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    create_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_market_options CHECK (market != "")
);

CREATE INDEX idx_reminders_is_global ON reminders(is_global);
CREATE INDEX idx_reminders_start_date ON reminders(start_date);
CREATE INDEX idx_reminders_expire_date ON reminders(expire_date);
CREATE INDEX idx_reminders_market ON reminders(market);
CREATE INDEX idx_reminders_all_businesss ON reminders(is_all_business);

CREATE TABLE IF NOT EXISTS reminder_to_business (
    reminder_id INT UNSIGNED NOT NULL,
    business_id TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (reminder_id, business_id),
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (business_id) REFERENCES business(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS acct_reminders (
    acct_id INT UNSIGNED NOT NULL,
    reminder_id INT UNSIGNED NOT NULL,
    is_processed BOOLEAN DEFAULT 0,
    last_processed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id),
    PRIMARY KEY (acct_id, reminder_id)
);

CREATE INDEX idx_acct_reminders_is_processed ON acct_reminders(is_processed);
CREATE INDEX idx_acct_reminders_last_processed_at ON acct_reminders(last_processed_at);

CREATE TABLE IF NOT EXISTS reminder_process_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    acct_id INT UNSIGNED NOT NULL,
    reminder_id INT UNSIGNED NOT NULL,
    processed_by INT UNSIGNED NOT NULL,
    processed_by_xf MEDIUMINT UNSIGNED, 
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    new_status BOOLEAN NOT NULL,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id)
);

CREATE INDEX idx_reminder_process_log_acct_id ON reminder_process_log(acct_id);
CREATE INDEX idx_reminder_process_log_reminder_id ON reminder_process_log(reminder_id);
CREATE INDEX idx_reminder_process_log_processed_at ON reminder_process_log(processed_at);