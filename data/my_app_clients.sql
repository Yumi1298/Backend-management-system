-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: my_app
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `sid` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `birthday` date NOT NULL,
  `mobile` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `product_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_source` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'王雅婷','1969-01-16','0991391398','2375','2024-11-04','網路購買'),(2,'柯震東','1997-06-14','0979982912','3335','2023-04-03','其他'),(3,'陳春嬌','1948-05-02','0938223501','6011','2024-01-28','實體店面'),(4,'黃磊','1944-01-09','0955830129','3675','2024-03-25','其他'),(5,'張雅婷','1969-06-14','0942797910','1542','2023-12-24','實體店面'),(6,'陳志強','1944-10-07','0990336203','6595','2024-09-10','網路購買'),(7,'唐正傑','1949-11-04','0988518520','2372','2022-06-30','其他'),(8,'王家豪','1997-10-29','0995807319','4157','2024-05-04','實體店面'),(9,'林家俊','1980-12-11','0941860579','12348','2024-05-27','網路購買'),(10,'林俊明','1964-08-16','0928857054','57523','2024-05-28','網路購買'),(11,'劉雅琪','1964-08-17','0925235481','2311','2024-05-29','其他'),(12,'張正淑','1964-08-18','0905489546','5642','2024-05-30','實體店面'),(13,'陳雅婷','1964-08-19','0904556451','8794','2024-05-31','網路購買'),(14,'劉志強','1988-02-11','0945612354','8795','2024-09-10','網路購買'),(15,'陳家豪','1998-02-14','0945612648','8796','2022-06-30','其他'),(16,'王俊銘','2000-12-01','0948565123','8797','2024-05-04','實體店面'),(17,'王雅琪','1992-05-07','0984561481','8798','2024-05-27','網路購買'),(18,'黃雅婷','1999-08-02','0904561234','8799','2024-05-28','網路購買'),(19,'張春嬌','2001-08-31','0940562164','8800','2024-05-29','其他'),(20,'黃震東','1995-07-11','0904561351','8801','2024-05-30','實體店面'),(21,'陳正傑','1993-12-04','0947895153','8802','2024-05-31','網路購買'),(22,'陳雅琪','1998-05-08','0953645974','8803','2024-09-10','網路購買'),(23,'陳磊','1999-07-02','0905234821','8804','2022-06-30','其他'),(24,'張雅琪','1990-01-24','0945621487','8805','2024-05-04','實體店面'),(25,'唐震東','2004-05-11','0935684561','8806','2024-05-27','網路購買'),(26,'王磊','1966-04-03','0935487563','8807','2024-05-28','網路購買'),(27,'黃正傑','1975-03-24','0986549565','8808','2024-05-29','其他'),(28,'黃志強','1979-06-04','0956348933','8809','2024-05-30','實體店面'),(29,'張志強','1980-07-02','0933325489','8810','2024-05-31','網路購買');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-03 19:50:14
