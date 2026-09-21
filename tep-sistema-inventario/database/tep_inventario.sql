-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 17, 2026 at 09:33 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tep_inventario`
--

-- --------------------------------------------------------

--
-- Table structure for table `detalle_movimientos`
--

CREATE TABLE `detalle_movimientos` (
  `idDetalle` int NOT NULL,
  `cantidadAfectada` int NOT NULL,
  `idMovimiento` int NOT NULL,
  `idInsumo` int NOT NULL,
  `idEquipoDestino` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `detalle_movimientos`
--

INSERT INTO `detalle_movimientos` (`idDetalle`, `cantidadAfectada`, `idMovimiento`, `idInsumo`, `idEquipoDestino`) VALUES
(1, 2, 2, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `equipos`
--

CREATE TABLE `equipos` (
  `idEquipo` int NOT NULL,
  `codPatrimonial` varchar(50) DEFAULT NULL,
  `tipoEquipo` varchar(50) NOT NULL,
  `marcaModelo` varchar(100) NOT NULL,
  `numeroSerie` varchar(100) NOT NULL,
  `ipFija` varchar(15) NOT NULL,
  `mascaraSubred` varchar(15) NOT NULL,
  `workgroup` varchar(50) NOT NULL,
  `estadoOperativo` varchar(50) NOT NULL,
  `idSector` int NOT NULL,
  `procesador` varchar(100) DEFAULT NULL,
  `memoriaRAM` varchar(50) DEFAULT NULL,
  `almacenamiento` varchar(50) DEFAULT NULL,
  `sistemaOperativo` varchar(100) DEFAULT NULL,
  `tecnologiaImpresion` varchar(100) DEFAULT NULL,
  `tipoConexion` varchar(100) DEFAULT NULL,
  `formatoPapel` varchar(50) DEFAULT NULL,
  `idInsumoCompatible` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `equipos`
--

INSERT INTO `equipos` (`idEquipo`, `codPatrimonial`, `tipoEquipo`, `marcaModelo`, `numeroSerie`, `ipFija`, `mascaraSubred`, `workgroup`, `estadoOperativo`, `idSector`, `procesador`, `memoriaRAM`, `almacenamiento`, `sistemaOperativo`, `tecnologiaImpresion`, `tipoConexion`, `formatoPapel`, `idInsumoCompatible`) VALUES
(1, 'TEP-PC-042', '', 'Dell OptiPlex 3090', 'SNDELL998877', '192.168.1.150', '255.255.255.0', 'TRIBUNAL', 'Activo', 2, 'Intel Core i5-10500', '16GB DDR4', '512GB SSD NVMe', 'Windows 10 Pro', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `historial_equipos`
--

CREATE TABLE `historial_equipos` (
  `idHistorial` int NOT NULL,
  `fechaCambio` datetime NOT NULL,
  `motivoBaja` varchar(255) NOT NULL,
  `idEquipo` int NOT NULL,
  `idSectorAnterior` int DEFAULT NULL,
  `idSectorNuevo` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `historial_equipos`
--

INSERT INTO `historial_equipos` (`idHistorial`, `fechaCambio`, `motivoBaja`, `idEquipo`, `idSectorAnterior`, `idSectorNuevo`) VALUES
(1, '2026-09-17 09:05:36', 'Traslado de sector', 1, 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `insumos`
--

CREATE TABLE `insumos` (
  `idInsumo` int NOT NULL,
  `codigoInterno` varchar(50) NOT NULL,
  `descripcion` varchar(500) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `stockActual` int NOT NULL,
  `stockSeguridad` int NOT NULL,
  `estadoActivo` tinyint NOT NULL,
  `ubicacionFila` varchar(50) NOT NULL,
  `ubicacionColumna` varchar(50) NOT NULL,
  `fechaVencimiento` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `insumos`
--

INSERT INTO `insumos` (`idInsumo`, `codigoInterno`, `descripcion`, `categoria`, `stockActual`, `stockSeguridad`, `estadoActivo`, `ubicacionFila`, `ubicacionColumna`, `fechaVencimiento`) VALUES
(1, 'TON-HP-85A', 'Tóner HP CE285A Negro Original', 'Tóner', 10, 3, 1, 'Estante B', 'Caja 4', '2027-12-31');

-- --------------------------------------------------------

--
-- Table structure for table `log_auditoria`
--

CREATE TABLE `log_auditoria` (
  `idLog` int NOT NULL,
  `fechaHora` datetime NOT NULL,
  `accionRealizada` varchar(255) NOT NULL,
  `moduloAfectado` varchar(50) NOT NULL,
  `idUsuario` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `log_auditoria`
--

INSERT INTO `log_auditoria` (`idLog`, `fechaHora`, `accionRealizada`, `moduloAfectado`, `idUsuario`) VALUES
(1, '2026-09-17 09:05:36', 'Actualización de equipo ID 1 (Dell OptiPlex 3090)', 'Equipos', 1);

-- --------------------------------------------------------

--
-- Table structure for table `matriz_compatibilidad`
--

CREATE TABLE `matriz_compatibilidad` (
  `idRegla` int NOT NULL,
  `idInsumo` int NOT NULL,
  `idEquipo` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `movimientos`
--

CREATE TABLE `movimientos` (
  `idMovimiento` int NOT NULL,
  `fechaHora` datetime NOT NULL,
  `tipoMovimiento` varchar(45) NOT NULL,
  `comprobanteRef` varchar(50) NOT NULL,
  `agenteReceptor` varchar(100) DEFAULT NULL,
  `idUsuario` int NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `movimientos`
--

INSERT INTO `movimientos` (`idMovimiento`, `fechaHora`, `tipoMovimiento`, `comprobanteRef`, `agenteReceptor`, `idUsuario`) VALUES
(2, '2026-09-16 22:31:33', 'Egreso', 'REMITO-001', 'Mesa de Entradas - Dr. Gómez', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sectores`
--

CREATE TABLE `sectores` (
  `idSector` int NOT NULL,
  `nombreOficina` varchar(100) NOT NULL,
  `estadoActivo` tinyint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `sectores`
--

INSERT INTO `sectores` (`idSector`, `nombreOficina`, `estadoActivo`) VALUES
(1, 'Mesa de Entradas', 1),
(2, 'Despacho del Juez', 1);

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `idUsuario` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rolAcceso` varchar(255) NOT NULL,
  `estadoActivo` tinyint NOT NULL,
  `pinRecuperacion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`idUsuario`, `username`, `password`, `rolAcceso`, `estadoActivo`) VALUES
(1, 'admin', '$2b$10$XFc7o1SYozyUwJfaq0xwlOjeGrpCUxLJFAsUpg9qBmLLRUpboYk/e', 'Administrador', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detalle_movimientos`
--
ALTER TABLE `detalle_movimientos`
  ADD PRIMARY KEY (`idDetalle`),
  ADD KEY `fk_Detalle_Movimientos_Movimientos1_idx` (`idMovimiento`),
  ADD KEY `fk_Detalle_Movimientos_Insumos1_idx` (`idInsumo`),
  ADD KEY `fk_Detalle_Movimientos_Equipos1_idx` (`idEquipoDestino`);

--
-- Indexes for table `equipos`
--
ALTER TABLE `equipos`
  ADD PRIMARY KEY (`idEquipo`),
  ADD UNIQUE KEY `uq_codPatrimonial` (`codPatrimonial`),
  ADD UNIQUE KEY `uq_numeroSerie` (`numeroSerie`),
  ADD KEY `fk_Equipos_Sectores1_idx` (`idSector`),
  ADD KEY `fk_equipos_insumo` (`idInsumoCompatible`);

--
-- Indexes for table `historial_equipos`
--
ALTER TABLE `historial_equipos`
  ADD PRIMARY KEY (`idHistorial`),
  ADD KEY `fk_Historial_Equipos_Equipos1_idx` (`idEquipo`),
  ADD KEY `fk_Historial_Equipos_Sectores1_idx` (`idSectorAnterior`),
  ADD KEY `fk_Historial_Equipos_Sectores2_idx` (`idSectorNuevo`);

--
-- Indexes for table `insumos`
--
ALTER TABLE `insumos`
  ADD PRIMARY KEY (`idInsumo`),
  ADD UNIQUE KEY `codigoInterno_UNIQUE` (`codigoInterno`);

--
-- Indexes for table `log_auditoria`
--
ALTER TABLE `log_auditoria`
  ADD PRIMARY KEY (`idLog`),
  ADD KEY `fk_Log_Auditoria_Usuarios_idx` (`idUsuario`);

--
-- Indexes for table `matriz_compatibilidad`
--
ALTER TABLE `matriz_compatibilidad`
  ADD PRIMARY KEY (`idRegla`),
  ADD KEY `fk_Matriz_Compatibilidad_Insumos1_idx` (`idInsumo`),
  ADD KEY `fk_Matriz_Compatibilidad_Equipos1_idx` (`idEquipo`);

--
-- Indexes for table `movimientos`
--
ALTER TABLE `movimientos`
  ADD PRIMARY KEY (`idMovimiento`),
  ADD KEY `fk_Movimientos_Usuarios1_idx` (`idUsuario`);

--
-- Indexes for table `sectores`
--
ALTER TABLE `sectores`
  ADD PRIMARY KEY (`idSector`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`idUsuario`),
  ADD UNIQUE KEY `username_UNIQUE` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detalle_movimientos`
--
ALTER TABLE `detalle_movimientos`
  MODIFY `idDetalle` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `equipos`
--
ALTER TABLE `equipos`
  MODIFY `idEquipo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `historial_equipos`
--
ALTER TABLE `historial_equipos`
  MODIFY `idHistorial` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `insumos`
--
ALTER TABLE `insumos`
  MODIFY `idInsumo` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `log_auditoria`
--
ALTER TABLE `log_auditoria`
  MODIFY `idLog` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `matriz_compatibilidad`
--
ALTER TABLE `matriz_compatibilidad`
  MODIFY `idRegla` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `movimientos`
--
ALTER TABLE `movimientos`
  MODIFY `idMovimiento` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sectores`
--
ALTER TABLE `sectores`
  MODIFY `idSector` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `idUsuario` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detalle_movimientos`
--
ALTER TABLE `detalle_movimientos`
  ADD CONSTRAINT `fk_Detalle_Movimientos_Equipos1` FOREIGN KEY (`idEquipoDestino`) REFERENCES `equipos` (`idEquipo`),
  ADD CONSTRAINT `fk_Detalle_Movimientos_Insumos1` FOREIGN KEY (`idInsumo`) REFERENCES `insumos` (`idInsumo`),
  ADD CONSTRAINT `fk_Detalle_Movimientos_Movimientos1` FOREIGN KEY (`idMovimiento`) REFERENCES `movimientos` (`idMovimiento`);

--
-- Constraints for table `equipos`
--
ALTER TABLE `equipos`
  ADD CONSTRAINT `fk_equipos_insumo` FOREIGN KEY (`idInsumoCompatible`) REFERENCES `insumos` (`idInsumo`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_Equipos_Sectores1` FOREIGN KEY (`idSector`) REFERENCES `sectores` (`idSector`);

--
-- Constraints for table `historial_equipos`
--
ALTER TABLE `historial_equipos`
  ADD CONSTRAINT `fk_Historial_Equipos_Equipos1` FOREIGN KEY (`idEquipo`) REFERENCES `equipos` (`idEquipo`),
  ADD CONSTRAINT `fk_Historial_Equipos_Sectores1` FOREIGN KEY (`idSectorAnterior`) REFERENCES `sectores` (`idSector`),
  ADD CONSTRAINT `fk_Historial_Equipos_Sectores2` FOREIGN KEY (`idSectorNuevo`) REFERENCES `sectores` (`idSector`);

--
-- Constraints for table `log_auditoria`
--
ALTER TABLE `log_auditoria`
  ADD CONSTRAINT `fk_Log_Auditoria_Usuarios` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`);

--
-- Constraints for table `matriz_compatibilidad`
--
ALTER TABLE `matriz_compatibilidad`
  ADD CONSTRAINT `fk_Matriz_Compatibilidad_Equipos1` FOREIGN KEY (`idEquipo`) REFERENCES `equipos` (`idEquipo`),
  ADD CONSTRAINT `fk_Matriz_Compatibilidad_Insumos1` FOREIGN KEY (`idInsumo`) REFERENCES `insumos` (`idInsumo`);

--
-- Constraints for table `movimientos`
--
ALTER TABLE `movimientos`
  ADD CONSTRAINT `fk_Movimientos_Usuarios1` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`idUsuario`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
