-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema tep_inventario
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema tep_inventario
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `tep_inventario` DEFAULT CHARACTER SET utf8 ;
USE `tep_inventario` ;

-- -----------------------------------------------------
-- Table `tep_inventario`.`Usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Usuarios` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Usuarios` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rolAcceso` VARCHAR(255) NOT NULL,
  `estadoActivo` TINYINT NOT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Log_Auditoria`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Log_Auditoria` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Log_Auditoria` (
  `idLog` INT NOT NULL AUTO_INCREMENT,
  `fechaHora` DATETIME NOT NULL,
  `accionRealizada` VARCHAR(255) NOT NULL,
  `moduloAfectado` VARCHAR(50) NOT NULL,
  `idUsuario` INT NOT NULL,
  PRIMARY KEY (`idLog`),
  INDEX `fk_Log_Auditoria_Usuarios_idx` (`idUsuario` ASC) VISIBLE,
  CONSTRAINT `fk_Log_Auditoria_Usuarios`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `tep_inventario`.`Usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Sectores`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Sectores` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Sectores` (
  `idSector` INT NOT NULL AUTO_INCREMENT,
  `nombreOficina` VARCHAR(100) NOT NULL,
  `estadoActivo` TINYINT NOT NULL,
  PRIMARY KEY (`idSector`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Equipos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Equipos` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Equipos` (
  `idEquipo` INT NOT NULL AUTO_INCREMENT,
  `codPatrimonial` VARCHAR(50) NULL,
  `marcaModelo` VARCHAR(100) NOT NULL,
  `numeroSerie` VARCHAR(100) NOT NULL,
  `ipFija` VARCHAR(15) NOT NULL,
  `mascaraSubred` VARCHAR(15) NOT NULL,
  `workgroup` VARCHAR(50) NOT NULL,
  `estadoOperativo` VARCHAR(50) NOT NULL,
  `idSector` INT NOT NULL,
  `procesador` VARCHAR(100) NOT NULL,
  `memoriaRAM` VARCHAR(50) NOT NULL,
  `almacenamiento` VARCHAR(50) NOT NULL,
  `sistemaOperativo` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`idEquipo`),
  INDEX `fk_Equipos_Sectores1_idx` (`idSector` ASC) VISIBLE,
  CONSTRAINT `fk_Equipos_Sectores1`
    FOREIGN KEY (`idSector`)
    REFERENCES `tep_inventario`.`Sectores` (`idSector`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Historial_Equipos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Historial_Equipos` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Historial_Equipos` (
  `idHistorial` INT NOT NULL AUTO_INCREMENT,
  `fechaCambio` DATETIME NOT NULL,
  `motivoBaja` VARCHAR(255) NOT NULL,
  `idEquipo` INT NOT NULL,
  `idSectorAnterior` INT NULL,
  `idSectorNuevo` INT NULL,
  PRIMARY KEY (`idHistorial`),
  INDEX `fk_Historial_Equipos_Equipos1_idx` (`idEquipo` ASC) VISIBLE,
  INDEX `fk_Historial_Equipos_Sectores1_idx` (`idSectorAnterior` ASC) VISIBLE,
  INDEX `fk_Historial_Equipos_Sectores2_idx` (`idSectorNuevo` ASC) VISIBLE,
  CONSTRAINT `fk_Historial_Equipos_Equipos1`
    FOREIGN KEY (`idEquipo`)
    REFERENCES `tep_inventario`.`Equipos` (`idEquipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Historial_Equipos_Sectores1`
    FOREIGN KEY (`idSectorAnterior`)
    REFERENCES `tep_inventario`.`Sectores` (`idSector`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Historial_Equipos_Sectores2`
    FOREIGN KEY (`idSectorNuevo`)
    REFERENCES `tep_inventario`.`Sectores` (`idSector`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Insumos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Insumos` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Insumos` (
  `idInsumo` INT NOT NULL AUTO_INCREMENT,
  `codigoInterno` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(500) NOT NULL,
  `categoria` VARCHAR(50) NOT NULL,
  `stockActual` INT NOT NULL,
  `stockSeguridad` INT NOT NULL,
  `estadoActivo` TINYINT NOT NULL,
  `ubicacionFila` VARCHAR(50) NOT NULL,
  `ubicacionColumna` VARCHAR(50) NOT NULL,
  `fechaVencimiento` DATE NOT NULL,
  PRIMARY KEY (`idInsumo`),
  UNIQUE INDEX `codigoInterno_UNIQUE` (`codigoInterno` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Movimientos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Movimientos` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Movimientos` (
  `idMovimiento` INT NOT NULL AUTO_INCREMENT,
  `fechaHora` DATETIME NOT NULL,
  `tipoMovimiento` VARCHAR(45) NOT NULL,
  `comprobanteRef` VARCHAR(50) NOT NULL,
  `agenteReceptor` VARCHAR(100) NULL,
  `idUsuario` INT NOT NULL,
  PRIMARY KEY (`idMovimiento`),
  INDEX `fk_Movimientos_Usuarios1_idx` (`idUsuario` ASC) VISIBLE,
  CONSTRAINT `fk_Movimientos_Usuarios1`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `tep_inventario`.`Usuarios` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Detalle_Movimientos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Detalle_Movimientos` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Detalle_Movimientos` (
  `idDetalle` INT NOT NULL AUTO_INCREMENT,
  `cantidadAfectada` INT NOT NULL,
  `idMovimiento` INT NOT NULL,
  `idInsumo` INT NOT NULL,
  `idEquipoDestino` INT NULL,
  PRIMARY KEY (`idDetalle`),
  INDEX `fk_Detalle_Movimientos_Movimientos1_idx` (`idMovimiento` ASC) VISIBLE,
  INDEX `fk_Detalle_Movimientos_Insumos1_idx` (`idInsumo` ASC) VISIBLE,
  INDEX `fk_Detalle_Movimientos_Equipos1_idx` (`idEquipoDestino` ASC) VISIBLE,
  CONSTRAINT `fk_Detalle_Movimientos_Movimientos1`
    FOREIGN KEY (`idMovimiento`)
    REFERENCES `tep_inventario`.`Movimientos` (`idMovimiento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Detalle_Movimientos_Insumos1`
    FOREIGN KEY (`idInsumo`)
    REFERENCES `tep_inventario`.`Insumos` (`idInsumo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Detalle_Movimientos_Equipos1`
    FOREIGN KEY (`idEquipoDestino`)
    REFERENCES `tep_inventario`.`Equipos` (`idEquipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `tep_inventario`.`Matriz_Compatibilidad`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tep_inventario`.`Matriz_Compatibilidad` ;

CREATE TABLE IF NOT EXISTS `tep_inventario`.`Matriz_Compatibilidad` (
  `idRegla` INT NOT NULL AUTO_INCREMENT,
  `idInsumo` INT NOT NULL,
  `idEquipo` INT NOT NULL,
  PRIMARY KEY (`idRegla`),
  INDEX `fk_Matriz_Compatibilidad_Insumos1_idx` (`idInsumo` ASC) VISIBLE,
  INDEX `fk_Matriz_Compatibilidad_Equipos1_idx` (`idEquipo` ASC) VISIBLE,
  CONSTRAINT `fk_Matriz_Compatibilidad_Insumos1`
    FOREIGN KEY (`idInsumo`)
    REFERENCES `tep_inventario`.`Insumos` (`idInsumo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Matriz_Compatibilidad_Equipos1`
    FOREIGN KEY (`idEquipo`)
    REFERENCES `tep_inventario`.`Equipos` (`idEquipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
