
-- (1) PowerShell:
--     cd .extras\compose\db\mysql
--     docker compose up
-- (1) 2. PowerShell:
--     cd .extras\compose\db\mysql
--     docker compose exec db bash
--         mysql --user=root --password=p < /sql/create-db-shopping-cart.sql
--         exit
--     docker compose down


CREATE USER IF NOT EXISTS 'shopping_cart_db_user'@'%' IDENTIFIED BY 'GentleCorp22.03.2024';
ALTER USER 'shopping_cart_db_user'@'%' IDENTIFIED WITH mysql_native_password BY 'GentleCorp22.03.2024';

FLUSH PRIVILEGES;

GRANT USAGE ON *.* TO 'shopping_cart_db_user';
GRANT USAGE ON *.* TO 'shopping_cart_db_user'@'%';

CREATE DATABASE IF NOT EXISTS `shopping_cart_db` CHARACTER SET utf8;

GRANT ALL PRIVILEGES ON `shopping_cart_db`.* to 'shopping_cart_db_user';
GRANT ALL PRIVILEGES ON `shopping_cart_db`.* to 'shopping_cart_db_user'@'%';

CREATE TABLESPACE shopping_cart_tablespace ADD DATAFILE 'shopping_cart_tablespace.ibd' ENGINE=INNODB;

-- mysql -u shopping_cart_db_user -p
-- GentleCorp21.08.2024