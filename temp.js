/*
env

URL = "http://localhost:8080"
COOKIE_DOMAIN = "localhost"

mit
# vijay-at-893906185188
# IHl/7TTErBx3vq9BQnYikExeAO/y21RVdmsAm0an0Wg=







const newData = await pool.query(
			`WITH inserted_table1 AS (
	         INSERT INTO vendors 
			 (uuid, vendor_vcard, vendor_proof, vendor_orgname, vendor_btype, vendor_category, vendor_gst)
	         VALUES ($1,$2,$3,$4,$5,$6,$7)
	         RETURNING *
             ),inserted_table2 AS (
	         INSERT INTO branches (uuid, branch_address, branch_city ,  branch_lat, branch_long)
	         VALUES ($1 , $8  , $9 , $10 , $11)
	         RETURNING *
             )
             SELECT *
             FROM inserted_table1, inserted_table2`,
			[
				req.body.uuid,
				req.body.vendor_vcard,
				req.body.vendor_proof,
				req.body.vendor_orgname,
				req.body.vendor_btype,
				req.body.vendor_category,
				req.body.vendor_gst,

				req.body.branch_address,
				req.body.branch_city,
				req.body.branch_lat,
				req.body.branch_long,
			]
		);



generate postgresql query with check below condiction 
1 .   vendor_is_verified = true in vendors table
2.  count of ads of uuid must be less than or equal to  plan_posts in transaction table
3. check vendor expiry by plan_to in transactions table with today date.
4. difference between plan_to and plan_from must be less or equal to  plan_post_duration
before inserting into ads table


add  CONSTRAINTs to ads table with check below condiction 
1 .   vendor_is_verified = true in vendors table
2.  count of ads of uuid must be less than or equal to  plan_posts in plans table
3. check vendor expiry by present_plan_expiry  column in vendors table with today date.
4. difference between ad_to and ad_from must be less or equal to  plan_post_duration in plans table




INSERT INTO ads (uuid, ad_type, ad_category, ad_title, ad_description, ad_tag, ad_from, ad_to, ad_duration, ad_file)
SELECT
    'your_uuid_value', -- Replace with the desired UUID value
    'your_ad_type_value', -- Replace with the desired ad type value
    'your_ad_category_value', -- Replace with the desired ad category value
    'your_ad_title_value', -- Replace with the desired ad title value
    'your_ad_description_value', -- Replace with the desired ad description value
    'your_ad_tag_value', -- Replace with the desired ad tag value
    'your_ad_from_value', -- Replace with the desired ad from value
    'your_ad_to_value', -- Replace with the desired ad to value
    'your_ad_duration_value', -- Replace with the desired ad duration value
    'your_ad_file_value' -- Replace with the desired ad file value
WHERE
    (SELECT COUNT(*) FROM ads WHERE uuid = 'your_uuid_value') <=
    (SELECT plan_posts FROM transactions WHERE uuid = 'your_uuid_value')
    AND EXISTS (
        SELECT 1 FROM vendors
        WHERE uuid = 'your_uuid_value'
        AND vendor_is_verified = true
        AND CURRENT_DATE <= (SELECT plan_to FROM transactions WHERE uuid = 'your_uuid_value')
        AND (SELECT plan_to - plan_from FROM transactions WHERE uuid = 'your_uuid_value') <= (SELECT plan_post_duration FROM transactions WHERE uuid = 'your_uuid_value')
    );





INSERT INTO ads (uuid, ad_type, ad_category, ad_title, ad_description, ad_from, ad_to, ad_duration, ad_file)
SELECT
  'example_uuid' AS uuid,
  'IMAGE' AS ad_type,
  'example_category' AS ad_category,
  'example_title' AS ad_title,
  'example_description' AS ad_description,
  '2023-06-21'::timestamp AS ad_from,
  '2023-06-28'::timestamp AS ad_to,
  7 AS ad_duration,
  'example_file' AS ad_file
WHERE
  (SELECT vendor_is_verified FROM vendors WHERE uuid = 'example_uuid') = true
  AND (SELECT COUNT(*) FROM ads WHERE uuid = 'example_uuid') <=
      (SELECT plan_posts FROM transactions WHERE uuid = 'example_uuid')
  AND (SELECT plan_to FROM transactions WHERE uuid = 'example_uuid') >= CURRENT_DATE
  AND (SELECT EXTRACT(EPOCH FROM (plan_to - plan_from)) FROM transactions WHERE uuid = 'example_uuid') <=
      (SELECT plan_post_duration FROM transactions WHERE uuid = 'example_uuid');


	
	  








	  WITH vendor_info AS (
  SELECT
    uuid,
    plan_posts
  FROM transactions
  WHERE uuid = 'INSERT_UUID_HERE'  -- Replace with the desired UUID
    AND transaction_timestamp <= CURRENT_TIMESTAMP
    AND CURRENT_TIMESTAMP <= plan_to
)
INSERT INTO ads (uuid, ad_type, ad_category, ad_title, ad_description, ad_tag, ad_from, ad_to, ad_duration, ad_file)
VALUES (
  'INSERT_UUID_HERE',  -- Replace with the desired UUID
  'INSERT_AD_TYPE_HERE',  -- Replace with the desired ad type
  'INSERT_AD_CATEGORY_HERE',  -- Replace with the desired ad category
  'INSERT_AD_TITLE_HERE',  -- Replace with the desired ad title
  'INSERT_AD_DESCRIPTION_HERE',  -- Replace with the desired ad description
  'INSERT_AD_TAG_HERE',  -- Replace with the desired ad tag
  'INSERT_AD_FROM_TIMESTAMP_HERE',  -- Replace with the desired ad start timestamp
  'INSERT_AD_TO_TIMESTAMP_HERE',  -- Replace with the desired ad end timestamp
  'INSERT_AD_DURATION_HERE',  -- Replace with the desired ad duration
  'INSERT_AD_FILE_HERE'  -- Replace with the desired ad file
)
WHERE
  EXISTS (
    SELECT 1
    FROM vendors
    WHERE uuid = 'INSERT_UUID_HERE'  -- Replace with the desired UUID
      AND vendor_is_verified = true
  )
  AND (
    SELECT COUNT(*)
    FROM vendor_info
  ) <= (
    SELECT plan_posts
    FROM vendor_info
  )
  AND (
    SELECT plan_to
    FROM vendor_info
  ) >= CURRENT_DATE
  AND (
    SELECT EXTRACT(EPOCH FROM (plan_to - plan_from)) / (60*60*24)
    FROM vendor_info
  ) <= (
    SELECT plan_post_duration
    FROM vendor_info
  );







CREATE TABLE ads (
  ad_id integer NOT NULL PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ad_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uuid VARCHAR(128) NOT NULL,
  ad_type VARCHAR(20) NOT NULL,
  ad_category VARCHAR(64) NOT NULL,
  ad_title VARCHAR(128) CHECK (ad_title ~ '^[a-zA-Z0-9_ ]{4,20}$') NOT NULL,
  ad_description TEXT NOT NULL,
  ad_tag VARCHAR(64) NOT NULL DEFAULT 'WHATSNEW',
  ad_from TIMESTAMP NOT NULL,
  ad_to TIMESTAMP NOT NULL,
  ad_duration integer NOT NULL,
  ad_file TEXT NOT NULL,

  CONSTRAINT check_ad_type CHECK (ad_type IN ('IMAGE', 'VIDEO', 'RESALE', 'ECOM', 'JOB')),
  CONSTRAINT check_vendor_verified CHECK (uuid IN (SELECT uuid FROM vendors WHERE vendor_is_verified = true)),
  CONSTRAINT check_ads_count CHECK ((SELECT COUNT(*) FROM ads WHERE ads.uuid = NEW.uuid) <= (SELECT plan_posts FROM transactions WHERE uuid = NEW.uuid)),
  CONSTRAINT check_vendor_expiry CHECK (uuid IN (SELECT uuid FROM transactions WHERE plan_to >= current_date)),
  CONSTRAINT check_plan_post_duration CHECK (ad_to - ad_from <= (SELECT plan_post_duration FROM transactions WHERE uuid = NEW.uuid))
);







*/
