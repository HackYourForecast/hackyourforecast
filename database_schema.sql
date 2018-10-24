-- MySQL dump 10.13  Distrib 8.0.11, for Win64 (x86_64)
--
-- Host: localhost    Database: weather
-- ------------------------------------------------------
-- Server version	8.0.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8mb4 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `stats`
--

DROP TABLE IF EXISTS `stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `stats` (
  `runTimeStamp` int(10) unsigned NOT NULL,
  `sourceApi` varchar(32) NOT NULL,
  `countOfItems` int(10) unsigned DEFAULT NULL,
  `sumOfTempC` float DEFAULT NULL,
  `sumOfWindMps` float DEFAULT NULL,
  `sumOfPressureHPA` float DEFAULT NULL,
  `lastUpdateTimestamp` int(10) unsigned DEFAULT NULL,
  `sumOfTempCDiff` float DEFAULT NULL,
  `tempDiffCount` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`sourceApi`,`runTimeStamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weather`
--

DROP TABLE IF EXISTS `weather`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `weather` (
  `geohash5` varchar(32) NOT NULL,
  `geohash3` varchar(32) NOT NULL,
  `lat` float NOT NULL,
  `sourceApi` varchar(32) NOT NULL,
  `lng` float NOT NULL,
  `symbol` varchar(255) DEFAULT NULL,
  `fromHour` int(10) unsigned NOT NULL,
  `altitude` float DEFAULT NULL,
  `fogPercent` float DEFAULT NULL,
  `pressureHPA` float DEFAULT NULL,
  `cloudinessPercent` float DEFAULT NULL,
  `windDirectionDeg` float DEFAULT NULL,
  `dewpointTemperatureC` float DEFAULT NULL,
  `windGustMps` float DEFAULT NULL,
  `humidityPercent` float DEFAULT NULL,
  `areaMaxWindSpeedMps` float DEFAULT NULL,
  `windSpeedMps` float DEFAULT NULL,
  `temperatureC` float DEFAULT NULL,
  `lowCloudsPercent` float DEFAULT NULL,
  `mediumCloudsPercent` float DEFAULT NULL,
  `highCloudsPercent` float DEFAULT NULL,
  `temperatureProbability` float DEFAULT NULL,
  `windProbability` float DEFAULT NULL,
  `updatedTimestamp` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`fromHour`,`geohash3`,`geohash5`,`sourceApi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weather_monitoring`
--

DROP TABLE IF EXISTS `weather_monitoring`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `weather_monitoring` (
  `geohash5` varchar(32) NOT NULL,
  `geohash3` varchar(32) NOT NULL,
  `lat` float NOT NULL,
  `sourceApi` varchar(32) NOT NULL,
  `lng` float NOT NULL,
  `symbol` varchar(255) DEFAULT NULL,
  `fromHour` int(10) unsigned NOT NULL,
  `altitude` float DEFAULT NULL,
  `fogPercent` float DEFAULT NULL,
  `pressureHPA` float DEFAULT NULL,
  `cloudinessPercent` float DEFAULT NULL,
  `windDirectionDeg` float DEFAULT NULL,
  `dewpointTemperatureC` float DEFAULT NULL,
  `windGustMps` float DEFAULT NULL,
  `humidityPercent` float DEFAULT NULL,
  `areaMaxWindSpeedMps` float DEFAULT NULL,
  `windSpeedMps` float DEFAULT NULL,
  `temperatureC` float DEFAULT NULL,
  `lowCloudsPercent` float DEFAULT NULL,
  `mediumCloudsPercent` float DEFAULT NULL,
  `highCloudsPercent` float DEFAULT NULL,
  `temperatureProbability` float DEFAULT NULL,
  `windProbability` float DEFAULT NULL,
  `updatedTimestamp` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`fromHour`,`geohash3`,`geohash5`,`sourceApi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-10-23 14:24:25
