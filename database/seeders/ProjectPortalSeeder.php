<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\BackgroundService;
use App\Models\ClientAccessCredential;
use App\Models\IotConfiguration;
use App\Models\Project;
use App\Models\ProjectCredential;
use App\Models\ProjectDocument;
use App\Models\ProjectLink;
use App\Models\ServerEnvironment;
use App\Models\ThirdPartyAccount;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProjectPortalSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@enricharcane.com',
                'password' => Hash::make('Enrich@1qaz'),
                'role' => 'superadmin',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Super+Admin&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Piumi Sam',
                'email' => 'teamsales@enricharcane.com',
                'password' => Hash::make('Password@123'),
                'role' => 'admin',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Piumi+Sam&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Sunimal Opatha',
                'email' => 'sunimal@enricharcane.com',
                'password' => Hash::make('Password@123'),
                'role' => 'admin',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Sunimal+Opatha&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Lakshitha Sankalpa',
                'email' => 'lakshitha.enrich@gmail.com',
                'password' => Hash::make('Password@123'),
                'role' => 'developer',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Lakshitha+Sankalpa&background=4f46e5&color=fff',
            ],
            [
                'name' => 'Tharindu perera',
                'email' => 'tharindu.enrich@gmail.com',
                'password' => Hash::make('Password@123'),
                'role' => 'developer',
                'avatar_url' => 'https://ui-avatars.com/api/?name=Tharindu+Perera&background=4f46e5&color=fff',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }

        // Real users from the list above, referenced by the projects below
        $admin     = User::where('email', 'admin@enricharcane.com')->firstOrFail();
        $lakshitha = User::where('email', 'lakshitha.enrich@gmail.com')->firstOrFail();
        $tharindu  = User::where('email', 'tharindu.enrich@gmail.com')->firstOrFail();

        // 2. Project 1: School Pickup Taxi & Attendance System
        $p1 = Project::updateOrCreate(
            ['code' => 'SP-TAXI-2026'],
            [
                'name' => 'School Pickup Taxi & Attendance System',
                'type' => 'hybrid',
                'status' => 'in_progress',
                'priority' => 'critical',
                'lead_developer_id' => $lakshitha->id,
                'manager_id' => $admin->id,
                'tech_stack' => 'Laravel 12, Flutter, ESP32, MQTT, MySQL 8.0, Redis, Docker',
                'description' => 'Real-time telemetry and student attendance tracking system integrating vehicle-mounted ESP32 hardware, RFID card scanners, and cross-platform Flutter parent/driver apps with automated SMS and push alerts.',
            ]
        );

        $p1->developers()->syncWithoutDetaching([$lakshitha->id, $tharindu->id]);

        // Links
        ProjectLink::create([
            'project_id' => $p1->id,
            'category' => 'github',
            'title' => 'Backend API & Telemetry Repo',
            'url' => 'https://github.com/enrich-systems/school-taxi-api',
            'branch_strategy' => 'main -> Production (AWS), develop -> Staging',
        ]);
        ProjectLink::create([
            'project_id' => $p1->id,
            'category' => 'github',
            'title' => 'ESP32 Device Firmware (C++ / PlatformIO)',
            'url' => 'https://github.com/enrich-systems/school-taxi-hardware',
            'branch_strategy' => 'main -> Production OTA releases',
        ]);
        ProjectLink::create([
            'project_id' => $p1->id,
            'category' => 'gitlab',
            'title' => 'Driver & Parent Mobile App (Flutter)',
            'url' => 'https://gitlab.com/enrich-systems/school-taxi-mobile',
            'branch_strategy' => 'master -> TestFlight & Play Console',
        ]);
        ProjectLink::create([
            'project_id' => $p1->id,
            'category' => 'figma',
            'title' => 'Mobile UI/UX Wireframes & Component System',
            'url' => 'https://figma.com/@enrich/school-taxi-v2-specs',
            'branch_strategy' => 'Design version 2.4 - Approved',
        ]);
        ProjectLink::create([
            'project_id' => $p1->id,
            'category' => 'postman',
            'title' => 'API v2 Collection & Integration Tests',
            'url' => 'https://postman.com/enrich-workspace/school-taxi-api-tests',
            'branch_strategy' => 'Synchronized with develop branch schema',
        ]);

        // Third Party Accounts
        ThirdPartyAccount::create([
            'project_id' => $p1->id,
            'service_provider' => 'Google Cloud Platform',
            'account_identifier' => 'devops@enrich.com',
            'login_password' => 'GCP#MasterEnrich2026!',
            'console_url' => 'https://console.cloud.google.com/home/dashboard?project=enrich-taxi-attendance',
            'project_or_app_id' => 'enrich-taxi-attendance',
            'environment' => 'production',
            'notes' => 'Primary account for Google Maps Geocoding & Distance Matrix API. 2FA configured on Hardware YubiKey.',
        ]);
        ThirdPartyAccount::create([
            'project_id' => $p1->id,
            'service_provider' => 'Firebase / Google Cloud FCM',
            'account_identifier' => 'firebase-admin@enrich.com',
            'login_password' => 'FirebasePush#2026Enrich',
            'console_url' => 'https://console.firebase.google.com/project/enrich-taxi-attendance',
            'project_or_app_id' => 'enrich-taxi-attendance-fcm',
            'environment' => 'production',
            'notes' => 'Used for high-priority driver arrival notification push alerts to iOS & Android apps.',
        ]);
        ThirdPartyAccount::create([
            'project_id' => $p1->id,
            'service_provider' => 'Twilio SMS Gateway',
            'account_identifier' => 'billing-sms@enrich.com',
            'login_password' => 'TwilioAuthTokenSecret991',
            'console_url' => 'https://console.twilio.com',
            'project_or_app_id' => 'AC4829104810294109481',
            'environment' => 'production',
            'notes' => 'Automated SMS dispatched to parents upon child tap-in/tap-out on vehicle bus.',
        ]);

        // Credentials Vault
        ProjectCredential::create([
            'project_id' => $p1->id,
            'category' => 'api_key',
            'key_name' => 'GOOGLE_MAPS_GEOCODING_API_KEY',
            'key_value' => 'AIzaSyD94uQ-z9391xKL90129_taxi_prod_maps_key_enrich_secure',
            'environment' => 'production',
        ]);
        ProjectCredential::create([
            'project_id' => $p1->id,
            'category' => 'webhook_secret',
            'key_name' => 'TWILIO_STATUS_CALLBACK_SECRET',
            'key_value' => 'whsec_9918204128941098231_enrich_telemetry_webhook_token',
            'environment' => 'production',
        ]);
        ProjectCredential::create([
            'project_id' => $p1->id,
            'category' => 'db_password',
            'key_name' => 'PROD_RDS_MYSQL_PASSWORD',
            'key_value' => 'Pr0d#Enrich_Mysql_Pass_9921!SafeVaultSecret',
            'environment' => 'production',
        ]);
        ProjectCredential::create([
            'project_id' => $p1->id,
            'category' => 'oauth_token',
            'key_name' => 'FIREBASE_MESSAGING_V1_BEARER',
            'key_value' => 'ya29.a0AfB_byC_demo_service_account_token_enrich_fcm_secret_key',
            'environment' => 'production',
        ]);
        ProjectCredential::create([
            'project_id' => $p1->id,
            'category' => 'api_key',
            'key_name' => 'LOCAL_MOCK_PAYMENT_KEY',
            'key_value' => 'sk_test_51MzDemoKey_for_local_testing_only',
            'environment' => 'local',
        ]);

        // Server Environments
        ServerEnvironment::create([
            'project_id' => $p1->id,
            'environment_type' => 'production',
            'hosting_provider' => 'AWS EC2 / RDS / ElastiCache',
            'ip_address' => '54.210.88.19',
            'hostname' => 'api.schoolpickup.app',
            'ssh_port' => 22,
            'ssh_user' => 'ubuntu',
            'ssh_credential' => "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn\nNhAAAAAwEAAQAAAYEA3K4...ENCRYPTED_VAULT_KEY_ENRICH...==\n-----END OPENSSH PRIVATE KEY-----",
            'runtime_stack' => 'PHP 8.3-FPM, Node 20, Nginx 1.24, MySQL 8.0, Redis 7.2',
            'deploy_path' => '/var/www/school-taxi-api',
            'env_backup' => "APP_NAME=\"School Pickup Taxi API\"\nAPP_ENV=production\nAPP_KEY=base64:Q1iZ/XWtICukRh4pqgkAigHVeRhbm2xWI2GjGeEDQrE=\nAPP_DEBUG=false\nAPP_URL=https://api.schoolpickup.app\nDB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_DATABASE=school_taxi_prod\nREDIS_HOST=127.0.0.1",
        ]);
        ServerEnvironment::create([
            'project_id' => $p1->id,
            'environment_type' => 'staging',
            'hosting_provider' => 'DigitalOcean Droplet (Bangalore Region)',
            'ip_address' => '167.99.142.10',
            'hostname' => 'staging.schoolpickup.app',
            'ssh_port' => 2202,
            'ssh_user' => 'deployer',
            'ssh_credential' => 'StagingDeploy#Pass9921!',
            'runtime_stack' => 'PHP 8.3-FPM, Nginx, MariaDB 10.11, Redis',
            'deploy_path' => '/var/www/staging-taxi-api',
            'env_backup' => "APP_NAME=\"School Pickup Taxi [Staging]\"\nAPP_ENV=staging\nAPP_DEBUG=true\nAPP_URL=https://staging.schoolpickup.app",
        ]);

        // Background Services & Daemons
        BackgroundService::create([
            'project_id' => $p1->id,
            'service_type' => 'cron_schedule',
            'command' => 'php artisan schedule:run',
            'frequency_or_config' => '* * * * *',
            'monitoring_notes' => 'Runs automated vehicle geofence proximity checks, daily trip summary generation, and dead-man switch alerts.',
        ]);
        BackgroundService::create([
            'project_id' => $p1->id,
            'service_type' => 'queue_worker',
            'command' => 'php artisan queue:work --queue=telemetry,high,notifications,default --tries=3 --timeout=90',
            'frequency_or_config' => 'numprocs=4, autostart=true, autorestart=true',
            'monitoring_notes' => 'Supervisord daemon (/etc/supervisor/conf.d/taxi-workers.conf). Logs piped to /var/log/supervisor/taxi-queue.log.',
        ]);
        BackgroundService::create([
            'project_id' => $p1->id,
            'service_type' => 'websocket',
            'command' => 'php artisan reverb:start --host=0.0.0.0 --port=8080',
            'frequency_or_config' => 'daemon, reverse proxy through nginx /ws',
            'monitoring_notes' => 'Real-time WebSocket broadcasting for live map vehicle markers.',
        ]);

        // IoT Configurations
        IotConfiguration::create([
            'project_id' => $p1->id,
            'hardware_model' => 'ESP32 WROOM-32U (External Antenna + SIM800L GSM)',
            'firmware_version' => 'v1.4.2-prod',
            'communication_protocol' => 'MQTT',
            'broker_url' => 'mqtt.schoolpickup.app',
            'port' => '8883 (TLS Mutual Auth)',
            'topic_structure' => 'enrich/school/bus/{bus_id}/telemetry & attendance',
            'auth_token_or_certs' => 'device_jwt_bearer_token_secret_encrypted_99182',
        ]);
        IotConfiguration::create([
            'project_id' => $p1->id,
            'hardware_model' => 'MFRC522 13.56MHz RFID Scanner & Buzzer Shield',
            'firmware_version' => 'v2.1.0-embedded',
            'communication_protocol' => 'HTTP_REST',
            'broker_url' => 'api.schoolpickup.app',
            'port' => '443 (HTTPS)',
            'topic_structure' => 'POST /api/v1/devices/tap-in-event',
            'auth_token_or_certs' => 'rfid_scanner_device_secret_token_1829',
        ]);

        // Documents
        ProjectDocument::create([
            'project_id' => $p1->id,
            'title' => 'SRS & System Architecture Specification.pdf',
            'file_path' => 'documents/SP-TAXI-2026/Centralized_Project_Management_SRS.pdf',
            'file_type' => 'pdf',
            'file_size' => 2450000,
        ]);
        ProjectDocument::create([
            'project_id' => $p1->id,
            'title' => 'ESP32 Hardware Schematic & Pinout Diagram.png',
            'file_path' => 'documents/SP-TAXI-2026/esp32_schematic.png',
            'file_type' => 'png',
            'file_size' => 1120000,
        ]);

        // Client Access Credentials
        ClientAccessCredential::create([
            'project_id' => $p1->id,
            'username' => 'school_admin',
            'email' => 'principal@colomboschool.edu',
            'password' => 'SchoolPrincipal#2026Secure!',
            'role' => 'Primary School Administrator',
            'login_url' => 'https://portal.schoolpickup.app/login',
            'environment' => 'production',
            'notes' => 'Principal office portal account. Has permissions to add student RFID tags and broadcast school-wide pickup alerts.',
        ]);
        ClientAccessCredential::create([
            'project_id' => $p1->id,
            'username' => 'transport_manager',
            'email' => 'fleet@colomboschool.edu',
            'password' => 'FleetTransport#9921!',
            'role' => 'Transport & Fleet Coordinator',
            'login_url' => 'https://portal.schoolpickup.app/login',
            'environment' => 'production',
            'notes' => 'Vehicle assignment and route dispatch operator.',
        ]);
        ClientAccessCredential::create([
            'project_id' => $p1->id,
            'username' => 'qa_test_client',
            'email' => 'test-client@enrich.com',
            'password' => 'TestClientPass#2026',
            'role' => 'QA Test Client',
            'login_url' => 'https://staging.schoolpickup.app/login',
            'environment' => 'staging',
            'notes' => 'Staging sandbox testing account for verifying parent/driver notifications.',
        ]);

        // Documents & Uploads
        ProjectDocument::create([
            'project_id' => $p1->id,
            'title' => 'Software Requirements Specification (SRS) v2.4.pdf',
            'file_path' => 'documents/SP-TAXI-2026/school_taxi_srs_v2.4.pdf',
            'file_type' => 'pdf',
            'file_size' => 4521984,
        ]);
        ProjectDocument::create([
            'project_id' => $p1->id,
            'title' => 'ESP32 Vehicle Telemetry Firmware & C++ Drivers.zip',
            'file_path' => 'documents/SP-TAXI-2026/esp32_firmware_drivers.zip',
            'file_type' => 'zip',
            'file_size' => 14680064,
        ]);
        ProjectDocument::create([
            'project_id' => $p1->id,
            'title' => 'Hardware Wiring & Pinout Diagram.docx',
            'file_path' => 'documents/SP-TAXI-2026/hardware_pinout_diagram.docx',
            'file_type' => 'docx',
            'file_size' => 1845248,
        ]);
        ProjectDocument::create([
            'project_id' => $p1->id,
            'title' => 'Project Architecture & UI Design Assets (Google Drive)',
            'file_path' => 'https://drive.google.com/drive/folders/1A2b3C4d5E6F7G8H9_school_taxi_specs',
            'file_type' => 'external',
            'file_size' => 0,
        ]);

        // 3. Project 2: Enterprise B2B Logistics API
        $p2 = Project::updateOrCreate(
            ['code' => 'LOGIX-B2B-2026'],
            [
                'name' => 'Enterprise B2B Logistics & Waybill Engine',
                'type' => 'api_service',
                'status' => 'in_progress',
                'priority' => 'high',
                'lead_developer_id' => $lakshitha->id,
                'manager_id' => $admin->id,
                'tech_stack' => 'Laravel 12, Go Microservice, PostgreSQL 16, Redis, Docker',
                'description' => 'High-throughput logistics orchestration API powering parcel tracking, automated waybill generation, carrier dispatch routing, and multi-tenant billing.',
            ]
        );
        $p2->developers()->syncWithoutDetaching([$lakshitha->id, $tharindu->id]);

        ProjectLink::create([
            'project_id' => $p2->id,
            'category' => 'github',
            'title' => 'Core Laravel Logistics API',
            'url' => 'https://github.com/enrich-systems/logix-core-api',
            'branch_strategy' => 'main -> Production',
        ]);
        ProjectCredential::create([
            'project_id' => $p2->id,
            'category' => 'api_key',
            'key_name' => 'FEDEX_ENTERPRISE_API_SECRET',
            'key_value' => 'fdx_live_secret_key_enrich_logistics_9921',
            'environment' => 'production',
        ]);
        ProjectCredential::create([
            'project_id' => $p2->id,
            'category' => 'webhook_secret',
            'key_name' => 'STRIPE_INVOICING_WEBHOOK_SECRET',
            'key_value' => 'whsec_stripe_b2b_logistics_live_2026',
            'environment' => 'production',
        ]);
        ServerEnvironment::create([
            'project_id' => $p2->id,
            'environment_type' => 'production',
            'hosting_provider' => 'Hetzner Dedicated Server (Falkenstein DC)',
            'ip_address' => '138.201.19.42',
            'hostname' => 'api.enrichlogix.com',
            'ssh_port' => 22,
            'ssh_user' => 'deploy',
            'ssh_credential' => 'HetznerSSH#KeySecret2026',
            'runtime_stack' => 'PHP 8.3, Go 1.22, PostgreSQL 16, Caddy Server',
            'deploy_path' => '/home/deploy/enrich-logix',
            'env_backup' => "APP_ENV=production\nAPP_KEY=base64:randomkey\nDB_CONNECTION=pgsql\nDB_DATABASE=logix_prod",
        ]);
        BackgroundService::create([
            'project_id' => $p2->id,
            'service_type' => 'supervisor_daemon',
            'command' => '/usr/local/bin/logix-waybill-worker --concurrency=8',
            'frequency_or_config' => 'numprocs=1, autostart=true',
            'monitoring_notes' => 'Compiled Go binary consuming RabbitMQ parcel routing queues.',
        ]);

        // 4. Project 3: Smart Agriculture Hydroponics Hub
        $p3 = Project::updateOrCreate(
            ['code' => 'AGRI-HYDRO-2026'],
            [
                'name' => 'Smart Agriculture Hydroponics Hub',
                'type' => 'iot_embedded',
                'status' => 'planning',
                'priority' => 'medium',
                'lead_developer_id' => $tharindu->id,
                'manager_id' => $admin->id,
                'tech_stack' => 'ESP32, FreeRTOS, MQTT, Node.js, TimescaleDB',
                'description' => 'Automated climate, pH balance, and nutrient dosing control system for greenhouse commercial hydroponics.',
            ]
        );
        $p3->developers()->syncWithoutDetaching([$tharindu->id, $lakshitha->id]);

        ProjectLink::create([
            'project_id' => $p3->id,
            'category' => 'github',
            'title' => 'Hydroponics Controller Firmware',
            'url' => 'https://github.com/enrich-systems/agri-hydro-firmware',
            'branch_strategy' => 'develop',
        ]);
        IotConfiguration::create([
            'project_id' => $p3->id,
            'hardware_model' => 'ESP32-S3 Dual Core + Atlas Scientific EZO pH Probe',
            'firmware_version' => 'v0.9.0-beta',
            'communication_protocol' => 'MQTT',
            'broker_url' => 'agri-broker.enrich.io',
            'port' => '8883',
            'topic_structure' => 'greenhouse/{zone_id}/sensors/ph_ec_temp',
            'auth_token_or_certs' => 'agri_device_auth_token_9934',
        ]);

        // 5. Initial Audit Logs
        AuditLog::create([
            'user_id' => $admin->id,
            'project_id' => $p1->id,
            'action_type' => 'VIEWED_SECRET',
            'target_field' => 'GOOGLE_MAPS_GEOCODING_API_KEY [production]',
            'ip_address' => '127.0.0.1',
            'created_at' => now()->subHours(2),
        ]);
        AuditLog::create([
            'user_id' => $lakshitha->id,
            'project_id' => $p1->id,
            'action_type' => 'COPIED_KEY',
            'target_field' => 'PROD_RDS_MYSQL_PASSWORD [production]',
            'ip_address' => '127.0.0.1',
            'created_at' => now()->subHour(),
        ]);
    }
}