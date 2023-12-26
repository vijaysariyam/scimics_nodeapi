


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
email varchar(50) UNIQUE not null,
hassed_password text  null,
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
DROP TABLE IF EXISTS scimic_question;CREATE TABLE IF NOT EXISTS scimic_questions(
scimic_question_pk SERIAL PRIMARY KEY,
is_ai_generated boolean default true,
is_approved boolean default true,
createdon timestamp with time zone DEFAULT CURRENT_TIMESTAMP + INTERVAL '5 hours 30 minutes',
updatedon timestamp with time zone  null,
parameter_id INTEGER not null,
category_id INTEGER not null,
);











