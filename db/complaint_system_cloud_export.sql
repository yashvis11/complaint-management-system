-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: complaint_system
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `complaint_updates`
--

DROP TABLE IF EXISTS `complaint_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_updates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `updated_by` int NOT NULL,
  `status` enum('Pending','In Progress','Resolved','Rejected') NOT NULL,
  `remarks` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `complaint_updates_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE,
  CONSTRAINT `complaint_updates_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_updates`
--

LOCK TABLES `complaint_updates` WRITE;
/*!40000 ALTER TABLE `complaint_updates` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaint_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `priority` enum('Low','Medium','High') DEFAULT 'Medium',
  `status` enum('Pending','In Progress','Resolved','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_to` int DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `image_public_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_complaint_assigned_staff` (`assigned_to`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_complaint_assigned_staff` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES (1,1,'Fan broke','Fan broke','electric','High','Resolved','2026-09-18 10:48:49','2026-11-22 09:46:29',12,NULL,NULL),(5,9,'Projector broken','Projector screen is broken','Infrastructure','High','Resolved','2026-10-20 18:46:01','2026-11-22 09:47:06',3,NULL,NULL),(6,9,'Random','This is a test complaint','Transport','Low','Pending','2026-10-20 20:32:59','2026-10-21 05:34:01',NULL,'uploads/dd33c323dd9f68c522bfca62a596b1fb.png',NULL),(7,11,'Test complaint for email','This is a test complaint to check if the email system works','Academic','Medium','In Progress','2026-11-22 07:56:14','2026-11-22 08:02:50',3,'uploads/d717620a529ecf8e289316052b8c0d5f.png',NULL),(8,11,'Test complaint2','Test complaint2','Library','Low','Resolved','2026-11-22 18:23:20','2026-11-23 09:35:06',12,'uploads/7c6f0c32e88e9c4b8660fd97cd2b2819.jpg',NULL),(9,11,'docker','docker','Transport','Low','Pending','2026-11-22 19:11:47','2026-11-22 19:11:47',NULL,'uploads/0c371a5ef8431c6f06ecd4abeb7de054.jpg',NULL),(10,11,'mail','mail','Hostel','Low','Pending','2026-11-23 04:36:48','2026-11-23 04:36:48',NULL,'uploads/29198e605b4019d3ea03e61a1bc79c84.jpg',NULL),(11,11,'local','local','Canteen','Medium','Pending','2026-11-23 06:58:38','2026-11-23 06:58:38',NULL,'uploads/45a6e7d5ac7bc04571fa66671e97f122.png',NULL),(12,11,'cloud','cloud','Hostel','Medium','Pending','2026-11-23 07:01:51','2026-11-23 07:01:51',NULL,'uploads/2e7828b5e4071f2fff6ae58b81af0e36.jpg',NULL),(13,11,'cloud2','cloud2','Library','Medium','Pending','2026-11-23 07:20:05','2026-11-23 07:20:05',NULL,'https://res.cloudinary.com/pab0idhj/image/upload/v1795418405/complaint-management-system/a680e66adc03a0c9f2162fb901a5f297.jpg','complaint-management-system/a680e66adc03a0c9f2162fb901a5f297'),(14,11,'cloud3','cloud3','Canteen','Medium','Pending','2026-11-23 08:15:04','2026-11-23 08:15:04',NULL,'https://res.cloudinary.com/pab0idhj/image/upload/v1795421703/complaint-management-system/a387c5877589435f39f4b2bfd87747de.png','complaint-management-system/a387c5877589435f39f4b2bfd87747de'),(15,11,'mail','mail','Hostel','Medium','In Progress','2026-11-23 09:36:06','2026-11-23 09:40:07',12,'https://res.cloudinary.com/pab0idhj/image/upload/v1795426565/complaint-management-system/6a18fa1901831c50e0eda85bdabd1a22.jpg','complaint-management-system/6a18fa1901831c50e0eda85bdabd1a22');
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin','staff') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reset_token_hash` varchar(64) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Reena','hey@example.com','$2b$10$lMwY4GSUFHPNWa4Rl70XNuCvCpLo1NucKp4DAWhxNORuPVuWLTfOK','user','2026-08-24 14:25:49',NULL,NULL,NULL,1),(2,'Ashwin','hi@example.com','$2b$10$piDHclxko8uB8JIXtIff8eEECrRAxrqKVSorU/YDHkxZNQqlwn1r2','user','2026-08-24 14:28:04',NULL,NULL,NULL,1),(3,'Meena Deshmukh','meena@gmail.com','$2b$10$ZBR0jiPCipM2SuOjhDR37.YCVDHGR2u/nbXSTAJKNrzga/DQyZaAW','staff','2026-09-02 08:52:44',NULL,NULL,NULL,1),(4,'Rajesh Kumar','abcd@gmail.com','$2b$10$so8SK6/4n3Poy6NobfrUO.FTakYQlVn4UEjxpxTGlmf2I3UeABrS.','user','2026-09-02 09:48:00',NULL,NULL,NULL,1),(5,'merger','mergetest123@gmail.com','$2b$10$ITu4QtwvcBFvUtQT55JWH.Cqomw.1WbpjgDGnVQxTvjSxHXnLeh/q','user','2026-09-18 10:41:59',NULL,NULL,NULL,1),(6,'Dipa Verma','dipa123@gmail.com','$2b$10$LLsa/0iJImRIhDw8JQBHAusoFgeIHuCklJILg4f.Jtad.vF5YBgnG','user','2026-10-18 19:11:55',NULL,NULL,NULL,1),(7,'Dipa Agarwal','dipa@gmail.com','$2b$10$RZpVEOTc/vBzyxr1L2cKOuRSI5CbluXml1folP8mxkvuExUL/CQcG','user','2026-10-18 19:13:29',NULL,NULL,NULL,1),(8,'Raju Rastogi ','raju123@gmail.com','$2b$10$yeKci8hABdmXCD7U2AKDO.7b8K/FazTG3Ff39UPiQyxiFeUmddKEq','user','2026-10-20 18:26:36',NULL,NULL,NULL,1),(9,'Maya Rajwat','maya123@gmail.com','$2b$10$9.vxuwWiIjUZqfA7KhgjkOpoM6aYHD1aG6funFVfNheRWuh5EDh4G','user','2026-10-20 18:28:52',NULL,NULL,NULL,1),(10,'admin1','admin@gmail.com','$2b$10$NP3b7sBd55TrOpNqGN9nVuiVJDM.PAsAGsCu0/JZDlHQjRrM6fJii','admin','2026-10-20 19:39:43',NULL,NULL,NULL,1),(11,'Meena Kumari','yashvimoto11@gmail.com','$2b$10$5NTDtWgs9UJg04w5uCcTpucukxzRaJPkAIHdv3ndhoXoYZKunhgeq','user','2026-11-22 07:55:02',NULL,NULL,NULL,1),(12,'Ramesh Gandhi','yashviphotos11@gmail.com','$2b$10$FGlEjmwQPL5dEo37pokfP.WoXAXS4OylG3FmkcBynrIq/.HzQA7hu','staff','2026-11-22 09:33:41',NULL,NULL,'Aerospace',1),(15,'student1','yashvimi11@gmail.com','$2b$10$61bGvi1iwGauhGtepOxXme6wPwJ2Cr8u1Oe7fMap6QTMKKHESJobm','user','2026-11-23 09:21:07',NULL,NULL,'CSE',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-23 12:29:03
