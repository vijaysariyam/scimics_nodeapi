


--start scimics
SET TIMEZONE ='Asia/Kolkata';

DROP TABLE IF EXISTS scimic_college;CREATE TABLE IF NOT EXISTS scimic_college(
    createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
    updatedon timestamp with time zone  null,
    college_pk SERIAL PRIMARY KEY,
    college_name varchar (500) not null
);insert into scimic_college(college_name)VALUES('Sri Venkateswara University College of Engineering');

DROP TABLE IF EXISTS scimic_course;CREATE TABLE IF NOT EXISTS scimic_course(
    course_pk SERIAL PRIMARY KEY,
    createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
    updatedon timestamp with time zone  null,
    college_pk integer not null,
    course_name varchar (500) not null
);
insert into scimic_course(college_pk , course_name)VALUES(1 , 'Computer Science and Engineering');
Insert into scimic_course (college_pk , course_name) values(1 , 'Electronics & Communication Engineering')


DROP TABLE IF EXISTS scimic_user;CREATE TABLE IF NOT EXISTS scimic_user(
user_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,

otp varchar (10) default null,
institution_id varchar (10)  null,
is_blocked boolean default false,
firstname varchar(25) not null,
lastname varchar(25) not null,
email varchar(50) null,
hassed_password text  null,
github_id integer  null,
country varchar(10)  null,
country_code varchar(3)  null,
phone varchar(10)  null,
is_phone_verified boolean default false,
college_id integer  null,
course_id integer  null,
signin_source varchar not null,
is_account_verified boolean default false,
pic text  null
CONSTRAINT signin_source_type CHECK (signin_source IN ('EMAIL', 'GOOGLE' , 'GITHUB'))
);


DROP TABLE IF EXISTS scimic_exam_reports;CREATE TABLE IF NOT EXISTS scimic_exam_reports(
exam_report_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
user_id INTEGER not null,
total INTEGER not null,
won INTEGER not null,
technical_proficiency INTEGER not null,
tp_total INTEGER not null,
tp_won INTEGER not null,
communication_skills INTEGER not null,
cs_total INTEGER not null,
cs_won INTEGER not null,
cognitive_abilities INTEGER not null,
ca_total INTEGER not null,
ca_won INTEGER not null,
interpersonal_and_teamwork_skills INTEGER not null,
iats_total INTEGER not null,
iats_won INTEGER not null,
adaptability_and_continuous_learning INTEGER not null,
aacl_total INTEGER not null,
aacl_won INTEGER not null,
project_management_and_time_management INTEGER not null,
pmatm_total INTEGER not null,
pmatm_won INTEGER not null,
professional_etiquette_and_interview_preparedness INTEGER not null,
peaip_total INTEGER not null,
peiap_won INTEGER not null
);






--




DROP TABLE IF EXISTS icap_categories;CREATE TABLE IF NOT EXISTS icap_categories(
icap_category_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
icap_category_name varchar(50) UNIQUE not null
);
insert into icap_categories(icap_category_name)VALUES('Cognitive Abilities');


DROP TABLE IF EXISTS icap_subcategories;CREATE TABLE IF NOT EXISTS icap_subcategories(
icap_subcategory_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
icap_category_id INTEGER not null,
icap_subcategory_name varchar(50) UNIQUE not null,
icap_subcategory_info text default null
);
insert into icap_subcategories(icap_category_id , icap_subcategory_name , icap_subcategory_info)VALUES(1 , 'Quantitative Aptitude' , 'Number System, Percentage, Ratio and Proportion, Partnership, Profit & Loss, Simple & Compound Interest, Allegation and Mixture, Average, Time and Distance, Time and Work, Mensuration 2D & 3D, Permutation and Combination, Probability, Coordinate Geometry, Inequalities, Functions, Logarithm, Set Theory, Progressions, Quadratic Equations, Surds.');
insert into icap_subcategories(icap_category_id , icap_subcategory_name , icap_subcategory_info)VALUES(1 , 'Logical Reasoning' , 'Number System, Percentage, Ratio and Proportion, Partnership, Profit & Loss, Simple & Compound Interest, Allegation and Mixture, Average, Time and Distance, Time and Work, Mensuration 2D & 3D, Permutation and Combination, Probability, Coordinate Geometry, Inequalities, Functions, Logarithm, Set Theory, Progressions, Quadratic Equations, Surds.');



DROP TABLE IF EXISTS icap_qscategories;CREATE TABLE IF NOT EXISTS icap_qscategories(
icap_qscategory_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
icap_qscategory_name varchar(50) UNIQUE not null
);
insert into icap_qscategories(icap_qscategory_name)VALUES('MCQ');
insert into icap_qscategories(icap_qscategory_name)VALUES('AUDIO');



DROP TABLE IF EXISTS comprehension;CREATE TABLE IF NOT EXISTS comprehension(
comprehension_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
comprehension TEXT not null
);




DROP TABLE IF EXISTS scimic_questions;CREATE TABLE IF NOT EXISTS scimic_questions(
scimic_question_pk SERIAL PRIMARY KEY,
is_ai_generated boolean default true,
is_approved boolean default true,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
icap_category_id INTEGER not null,
icap_subcategory_id INTEGER not null,
icap_qscategory_id INTEGER not null,
question text not null,
option1 text not null,
option2 text not null,
option3 text not null,
option4 text not null,
answer text not null,
domain_id INTEGER default null,
comprehension_id INTEGER default null
);



DROP TABLE IF EXISTS icap_reports;CREATE TABLE IF NOT EXISTS icap_reports(
icap_report_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
user_id INTEGER not null,
total INTEGER not null,
won  INTEGER not null,
ca_total INTEGER not null,
ca_won INTEGER not null,
ca_time INTEGER not null,
tp_total INTEGER not null,
tp_won INTEGER not null,
tp_time INTEGER not null,
cs_total INTEGER not null,
cs_won INTEGER not null,
cs_time INTEGER not null,
pb_total INTEGER not null,
pb_won INTEGER not null,
pb_time INTEGER not null
);




DROP TABLE IF EXISTS icap_config;CREATE TABLE IF NOT EXISTS icap_config(
icap_config_pk SERIAL PRIMARY KEY,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,

ca_qa_total INTEGER not null,
ca_lr_total INTEGER not null,
ca_time INTEGER not null,
	
tp_dsk_total INTEGER not null,
tp_hc_total INTEGER not null,
tp_time INTEGER not null,
	
cs_s_total INTEGER not null,
cs_l_total INTEGER not null,
cs_r_total INTEGER not null,
cs_w_total INTEGER not null,
cs_time INTEGER not null,
	

pb_itws_total INTEGER not null,
pb_acl_total INTEGER not null,
pb_pmtm_total INTEGER not null,
pb_peip_total INTEGER not null,
	
pb_time INTEGER not null
	
	
);

insert into icap_config(
    ca_qa_total, ca_lr_total,  ca_time , 
    tp_dsk_total , tp_hc_total , tp_time , 
    cs_s_total , cs_l_total , cs_r_total , cs_w_total , cs_time , 
    pb_itws_total , pb_acl_total ,pb_pmtm_total , pb_peip_total ,  pb_time)
VALUES(
    10,10,30,
    10,10,30,
    0,10,5,0,45,
     5,5,5,5,30
    );





