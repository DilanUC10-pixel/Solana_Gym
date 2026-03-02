# 🏋️ GymChain — Gestión de Gimnasio en Solana

GymChain es un programa on-chain desarrollado en **Rust con Anchor** sobre la blockchain de **Solana**. Permite a dueños de gimnasios gestionar sus miembros y membresías de forma descentralizada, transparente e inmutable.

---

## 📌 ¿Qué hace el proyecto?

GymChain implementa un sistema CRUD completo para administrar un gimnasio:

- **Crear** un gimnasio vinculado a tu wallet (owner)
- **Registrar miembros** con nombre y días de membresía
- **Eliminar miembros** cerrando su cuenta en la blockchain
- **Activar/desactivar** membresías (ej: miembro moroso)
- **Actualizar días** restantes (ej: al renovar membresía)

Cada gimnasio y cada miembro son cuentas derivadas (**PDA**) únicas en Solana, lo que garantiza que no puede haber duplicados y que solo el owner autorizado puede modificarlas.

---

## 🏗️ Arquitectura

```
Owner (Wallet)
    │
    └── Gimnasio (PDA)
            │
            ├── Miembro A (PDA)
            ├── Miembro B (PDA)
            └── Miembro C (PDA)
```

### Structs principales

**`Gimnasio`**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `owner` | `Pubkey` | Wallet del dueño |
| `nombre` | `String` | Nombre del gimnasio |
| `miembros` | `Vec<Pubkey>` | Lista de PDAs de miembros |

**`Miembro`**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `gimnasio` | `String` | Nombre del gimnasio |
| `nombre` | `String` | Nombre del miembro |
| `dias_restantes` | `u16` | Días de membresía activos |
| `activo` | `bool` | Estado de la membresía |

---

## ⚙️ Instrucciones (Funciones del programa)

| Instrucción | Descripción |
|---|---|
| `crear_gimnasio(nombre)` | Crea la cuenta del gimnasio vinculada al owner |
| `registrar_miembro(nombre, dias)` | Registra un nuevo miembro con días de membresía |
| `eliminar_miembro(nombre)` | Da de baja al miembro y cierra su cuenta |
| `alternar_membresia(nombre)` | Activa o desactiva la membresía del miembro |
| `actualizar_dias(nombre, dias)` | Actualiza los días restantes (renovación) |

---

## 🔐 PDAs (Program Derived Addresses)

Las cuentas se derivan con los siguientes seeds:

- **Gimnasio:** `["gimnasio", nombre_gimnasio, owner_pubkey]`
- **Miembro:** `["miembro", nombre_miembro, owner_pubkey]`

Esto garantiza que:
1. Cada owner tiene su propio gimnasio único por nombre
2. No pueden existir dos miembros con el mismo nombre en el mismo gimnasio

---

## 🚀 Cómo usar el proyecto (Solana Playground)

1. Abre [Solana Playground](https://beta.solpg.io)
2. Haz fork de este repositorio o pega el contenido de `src/lib.rs`
3. Conecta tu wallet (devnet)
4. Haz clic en **Build** y luego **Deploy**
5. Usa el panel de **Test** para interactuar con el programa:

```
# Ejemplo de flujo:
1. crear_gimnasio("MiGym")
2. registrar_miembro("Juan", 30)
3. alternar_membresia("Juan")   → desactiva membresía
4. actualizar_dias("Juan", 60)  → renueva a 60 días
5. eliminar_miembro("Juan")     → da de baja
```

---

## 🛠️ Tecnologías

- [Solana](https://solana.com/) — Blockchain de alta velocidad
- [Anchor Framework](https://www.anchor-lang.com/) — Framework para programas Solana en Rust
- [Rust](https://www.rust-lang.org/) — Lenguaje de programación del programa

---
