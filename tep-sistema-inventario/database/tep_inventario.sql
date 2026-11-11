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
(1, 'TEP-PC-042', 'Computadora', 'Dell OptiPlex 3090', 'SNDELL998877', '192.168.1.150', '255.255.255.0', 'TRIBUNAL', 'Activo', 2, 'Intel Core i5-10500', '16GB DDR4', '512GB SSD NVMe', 'Windows 10 Pro', NULL, NULL, NULL, NULL);

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
  `fechaVencimiento` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `insumos`
--

INSERT INTO `insumos` (`idInsumo`, `codigoInterno`, `descripcion`, `categoria`, `stockActual`, `stockSeguridad`, `estadoActivo`, `ubicacionFila`, `ubicacionColumna`, `fechaVencimiento`) VALUES
(1, 'TON-HP-85A', 'Tóner HP CE285A Negro Original', 'Insumo', 10, 3, 1, 'Estante B', 'Caja 4', '2027-12-31');

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
  `pinRecuperacion` varchar(50) DEFAULT NULL,
  `fechaUltimoPin` datetime DEFAULT NULL,
  `solicitaPin` tinyint NOT NULL DEFAULT 0
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
  ADD UNIQUE KEY `uq_equipo_insumo` (`idEquipo`, `idInsumo`),
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

--
-- Cuenta maestra / Super Administrador por defecto (admin.tep)
-- Contraseña plana por defecto: tuPassword123
--
INSERT INTO `usuarios` (`username`, `password`, `rolAcceso`, `estadoActivo`) 
VALUES ('admin.tep', '$2b$10$XFc7o1SYozyUwJfaq0xwlOjeGrpCUxLJFAsUpg9qBmLLRUpboYk/e', 'Administrador', 1)
ON DUPLICATE KEY UPDATE `rolAcceso` = 'Administrador', `estadoActivo` = 1;
COMMIT;

-- ====================================================
-- INSERTS DEL RELEVAMIENTO FÍSICO - DATOS REALES TEP
-- ====================================================

-- 1. CARGA DE SECTORES
INSERT INTO `sectores` (`idSector`, `nombreOficina`, `estadoActivo`) VALUES
(1, 'Departamento de Informática', 1),
(2, 'Secretaría Electoral', 1),
(3, 'Mesa de Entradas y Notificaciones', 1),
(4, 'Fiscalía', 1),
(5, 'Despacho Dr. Claudio Daniel Moreno', 1),
(6, 'Despacho Dra. Sandra Mercedes Moreno', 1),
(7, 'Despacho Dra. Verónica Gabriela Hans de Dorrego', 1)
ON DUPLICATE KEY UPDATE `nombreOficina`=VALUES(`nombreOficina`), `estadoActivo`=VALUES(`estadoActivo`);


-- 2. CARGA DE INSUMOS (Tóners, Periféricos, Papelería)
INSERT IGNORE INTO `insumos` (`codigoInterno`, `descripcion`, `categoria`, `stockActual`, `stockSeguridad`, `estadoActivo`, `ubicacionFila`, `ubicacionColumna`, `fechaVencimiento`) VALUES
('INS-001', 'Tóner HP 85A Negro (CE285A) p/ LaserJet P1102w', 'Insumo (Consumibles, tóner, hojas, tintas)', 10, 4, 1, 'A', '1', NULL),
('GN-TOML2160', 'Toner GNEISS', 'Insumo Consumible', 15, 5, 1, 'B', '1', '2022.0'),
('OR-SMLT101', 'ORINK', 'Insumo (Consumibles, tóner, hojas, tintas)', 1, 5, 1, 'B', '1', '2026.0'),
('LA-BRT419K', 'PREMIUN TONER', 'Insumo (Consumibles, tóner, hojas, tintas)', 11, 5, 1, 'C', '1', '2026.0'),
('CE310/CF350A', 'NEXT ONE', 'Insumo (Consumibles, tóner, hojas, tintas)', 28, 5, 1, 'C', '1', '2026.0'),
('MP501', 'FOOTPRINT', 'Insumo (Consumibles, tóner, hojas, tintas)', 7, 5, 1, 'C', '1', '2026.0'),
('INF-TN880/3479', 'INFINITY', 'Insumo (Consumibles, tóner, hojas, tintas)', 1, 5, 1, 'D', '1', '2026.0'),
('LBTN419BK/NN/C', 'VeryJet', 'Insumo (Consumibles, tóner, hojas, tintas)', 7, 5, 1, 'D', '1', '2026.0'),
('ECO-BRO-TN880/3479', 'ECOLASER', 'Insumo (Consumibles, tóner, hojas, tintas)', 2, 5, 1, 'D', '1', '2026.0'),
('MGN-3550A', 'MGN Laser', 'Insumo (Consumibles, tóner, hojas, tintas)', 4, 5, 1, 'D', '1', '2025.0'),
('MLT-D205L', 'Evertec', 'Insumo (Consumibles, tóner, hojas, tintas)', 7, 5, 1, 'C', '2', '2017.0'),
('GN-TOD116L', 'MAGNUM', 'Insumo (Consumibles, tóner, hojas, tintas)', 4, 5, 1, 'D', '1', '2026.0'),
('CF287A', 'AQX', 'Insumo (Consumibles, tóner, hojas, tintas)', 3, 5, 1, 'D', '2', '2026.0'),
('TN880/3479', 'PREMIUN LASER', 'Insumo (Consumibles, tóner, hojas, tintas)', 5, 5, 1, 'C', '3', '2026.0'),
('CF287ACOMP', 'GLOBAL', 'Insumo (Consumibles, tóner, hojas, tintas)', 9, 5, 1, 'C', '3', '2026.0'),
('D115L', 'Tecnovibe', 'Insumo (Consumibles, tóner, hojas, tintas)', 3, 5, 1, 'D', '3', '2024.0'),
('H-CE311A', 'LTC', 'Insumo (Consumibles, tóner, hojas, tintas)', 8, 5, 1, 'D', '4', '2026.0'),
('DC-1560/1860/2360', 'mita', 'Insumo (Consumibles, tóner, hojas, tintas)', 2, 5, 1, 'B', '3', '2019.0'),
('PER-MOU-001', 'Mouse Óptico USB Genius DX-110', 'Periférico (Teclados, mouse, auriculares, cables)', 35, 10, 1, 'C', '1', NULL),
('PER-TEC-001', 'Teclado USB Genius KB-118', 'Periférico (Teclados, mouse, auriculares, cables)', 20, 5, 1, 'C', '2', NULL),
('PER-CAB-001', 'Patch Cord UTP Cat 6 (3 metros)', 'Conectividad y Red (Patch cords, switches, routers)', 50, 15, 1, 'C', '3', NULL),
('PER-CAB-002', 'Cable HDMI 2.0 (2 metros)', 'Periférico (Teclados, mouse, auriculares, cables)', 15, 5, 1, 'C', '4', NULL),
('INS-RES-A4', 'Resma A4 75g Autor', 'Útiles de Oficina y Papelería', 80, 20, 1, 'D', '1', NULL),
('INS-RES-OFI', 'Resma Oficio 75g Autor', 'Útiles de Oficina y Papelería', 40, 15, 1, 'D', '2', NULL),
('INS-TIN-EPS-N', 'Botella Tinta Epson 544 Negro', 'Insumo (Consumibles, tóner, hojas, tintas)', 12, 4, 1, 'B', '4', NULL),
('INS-TIN-EPS-C', 'Botella Tinta Epson 544 Cian', 'Insumo (Consumibles, tóner, hojas, tintas)', 8, 3, 1, 'B', '5', NULL);

-- 3. CARGA DE EQUIPOS
INSERT IGNORE INTO `equipos` (`codPatrimonial`, `tipoEquipo`, `marcaModelo`, `numeroSerie`, `ipFija`, `mascaraSubred`, `workgroup`, `estadoOperativo`, `idSector`, `procesador`, `memoriaRAM`, `almacenamiento`, `sistemaOperativo`, `tecnologiaImpresion`, `tipoConexion`, `formatoPapel`, `idInsumoCompatible`) VALUES
('PAT-2026-101', 'Computadora', 'Dell OptiPlex 3080', 'SN-INF-101', '192.168.1.101', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'Intel Core i5-10400', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-102', 'Computadora', 'Dell OptiPlex 3080', 'SN-INF-102', '192.168.1.102', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'Intel Core i5-10400', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-103', 'Computadora', 'Dell OptiPlex 3080', 'SN-INF-103', '192.168.1.103', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'Intel Core i5-10400', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-104', 'Computadora', 'Dell OptiPlex 3080', 'SN-INF-104', '192.168.1.104', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'Intel Core i5-10400', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-105', 'Computadora', 'HP ProDesk 400 G7', 'SN-INF-105', '192.168.1.105', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'Intel Core i7-10700', '16GB DDR4', '1TB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-106', 'Computadora', 'HP ProDesk 400 G7', 'SN-INF-106', '192.168.1.106', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'Intel Core i7-10700', '16GB DDR4', '1TB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-107', 'Computadora', 'Lenovo ThinkCentre M70s', 'SN-SEC-101', '192.168.1.50', '255.255.255.0', 'TRIBUNAL', 'Operativo', 2, 'Intel Core i5-10400', '8GB DDR4', '512GB SSD NVMe', 'Windows 10 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-108', 'Computadora', 'Lenovo ThinkCentre M70s', 'SN-MES-101', '192.168.1.40', '255.255.255.0', 'TRIBUNAL', 'Operativo', 3, 'Intel Core i5-10400', '8GB DDR4', '256GB SSD', 'Windows 10 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-109', 'Computadora', 'Dell OptiPlex 3080', 'SN-FIS-101', '192.168.1.60', '255.255.255.0', 'TRIBUNAL', 'Operativo', 4, 'Intel Core i5-10400', '16GB DDR4', '512GB SSD NVMe', 'Windows 10 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-110', 'Computadora', 'HP ProDesk 400 G7', 'SN-DES-MOR1', '192.168.1.70', '255.255.255.0', 'TRIBUNAL', 'Operativo', 5, 'Intel Core i7-10700', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-111', 'Computadora', 'HP ProDesk 400 G7', 'SN-DES-MOR2', '192.168.1.71', '255.255.255.0', 'TRIBUNAL', 'Operativo', 6, 'Intel Core i7-10700', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-112', 'Computadora', 'HP ProDesk 400 G7', 'SN-DES-HAN1', '192.168.1.72', '255.255.255.0', 'TRIBUNAL', 'Operativo', 7, 'Intel Core i7-10700', '16GB DDR4', '512GB SSD NVMe', 'Windows 11 Pro 64-bit', NULL, NULL, NULL, NULL),
('PAT-2026-201', 'Impresora / Escáner', 'RICOH M501', 'SN-RIC-501', '192.168.137.240', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', NULL, NULL, NULL, NULL),
('PAT-2026-202', 'Impresora / Escáner', 'Brother HL-L6200DW', 'SN-BRO-620', '192.168.0.090', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', NULL, NULL, NULL, NULL),
('PAT-2026-203', 'Impresora / Escáner', 'RICOH M 320F', 'SN-RIC-320', '192.168.137.66', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', NULL, NULL, NULL, NULL),
('PAT-2026-204', 'Impresora / Escáner', 'XEROX WORKCENTRE 3550', 'SN-XER-355', '192.168.137.112', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', NULL, NULL, NULL, NULL),
('PAT-2026-205', 'Impresora / Escáner', 'Brother HL-L8360CDW', 'SN-BRO-836', '192.168.137.67', '255.255.255.0', 'TRIBUNAL', 'Operativo', 1, 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', 'N/A (Impresora)', NULL, NULL, NULL, NULL);

-- ====================================================
-- INSERTS DE LA MATRIZ DE COMPATIBILIDAD (Cruces)
-- ====================================================

-- Usamos SELECTs internos para obtener los IDs reales generados por la base de datos
-- sin importar en qué número de auto-increment hayan quedado.

-- 1. Brother HL-L6200DW (PAT-2026-202) -> Usa tóners serie TN880/3479
INSERT IGNORE INTO `matriz_compatibilidad` (`idInsumo`, `idEquipo`)
SELECT i.idInsumo, e.idEquipo FROM insumos i, equipos e 
WHERE i.codigoInterno IN ('INF-TN880/3479', 'ECO-BRO-TN880/3479', 'TN880/3479') 
AND e.codPatrimonial = 'PAT-2026-202';

-- 2. Brother HL-L8360CDW (PAT-2026-205) -> Usa tóners serie TN419 (Color)
INSERT IGNORE INTO `matriz_compatibilidad` (`idInsumo`, `idEquipo`)
SELECT i.idInsumo, e.idEquipo FROM insumos i, equipos e 
WHERE i.codigoInterno IN ('LA-BRT419K', 'LBTN419BK/NN/C') 
AND e.codPatrimonial = 'PAT-2026-205';

-- 3. XEROX WORKCENTRE 3550 (PAT-2026-204) -> Usa tóner MGN-3550A
INSERT IGNORE INTO `matriz_compatibilidad` (`idInsumo`, `idEquipo`)
SELECT i.idInsumo, e.idEquipo FROM insumos i, equipos e 
WHERE i.codigoInterno = 'MGN-3550A' 
AND e.codPatrimonial = 'PAT-2026-204';

-- 4. RICOH M501 (PAT-2026-201) -> Usa tóner MP501
INSERT IGNORE INTO `matriz_compatibilidad` (`idInsumo`, `idEquipo`)
SELECT i.idInsumo, e.idEquipo FROM insumos i, equipos e 
WHERE i.codigoInterno = 'MP501' 
AND e.codPatrimonial = 'PAT-2026-201';

-- Nota: Para la RICOH M 320F (PAT-2026-203) no hay tóners SP-3710SF cargados 
-- actualmente en el listado de insumos activos.

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;