//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";

////////////////// Constantes ////////////////////
const nombre_gimnasio = "MiGym"; // Cambia esto por el nombre de tu gimnasio
const owner = pg.wallet.publicKey; // Tu wallet conectada en Solana Playground

//////////////////// Client Test Logs ////////////////////
console.log("Mi dirección:", owner.toString());
const balance = await pg.connection.getBalance(owner);
console.log(`Mi balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

//////////////////// OBTENER PDAs ////////////////////
/*
  Las PDAs (Program Derived Addresses) son cuentas controladas por el programa.
  Se generan de forma determinista a partir de "semillas" (seeds).
  Usamos las mismas semillas que definimos en el programa Rust para encontrar
  la dirección correcta de cada cuenta.
*/

//////////////////// PDA Gimnasio ////////////////////
function pdaGimnasio(nombre_gym) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("gimnasio"),       // Semilla 1: b"gimnasio"
      Buffer.from(nombre_gym),       // Semilla 2: nombre del gimnasio -> String
      owner.toBuffer(),              // Semilla 3: wallet del owner -> Pubkey
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// PDA Miembro ////////////////////
function pdaMiembro(nombre_miembro) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("miembro"),        // Semilla 1: b"miembro"
      Buffer.from(nombre_miembro),   // Semilla 2: nombre del miembro -> String
      owner.toBuffer(),              // Semilla 3: wallet del owner -> Pubkey
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// FUNCIONES ////////////////////

//////////////////// Crear Gimnasio ////////////////////
// Registra un nuevo gimnasio en la blockchain vinculado a tu wallet
async function crearGimnasio(nombre_gym) {
  const [pda_gimnasio] = pdaGimnasio(nombre_gym);

  const txHash = await pg.program.methods
    .crearGimnasio(nombre_gym)
    .accounts({
      owner: owner,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log("Gimnasio creado! txHash:", txHash);
}

//////////////////// Registrar Miembro ////////////////////
// Agrega un nuevo miembro con nombre y días de membresía
async function registrarMiembro(nombre_miembro, dias) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .registrarMiembro(nombre_miembro, dias)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Miembro '${nombre_miembro}' registrado! txHash:`, txHash);
}

//////////////////// Alternar Membresía ////////////////////
// Activa o desactiva la membresía de un miembro
async function alternarMembresia(nombre_miembro) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .alternarMembresia(nombre_miembro)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Membresía de '${nombre_miembro}' alternada! txHash:`, txHash);
}

//////////////////// Actualizar Días ////////////////////
// Renueva o modifica los días de membresía de un miembro
async function actualizarDias(nombre_miembro, nuevos_dias) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .actualizarDias(nombre_miembro, nuevos_dias)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Días de '${nombre_miembro}' actualizados a ${nuevos_dias}! txHash:`, txHash);
}

//////////////////// Eliminar Miembro ////////////////////
// Da de baja al miembro y cierra su cuenta (se recupera el rent)
async function eliminarMiembro(nombre_miembro) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .eliminarMiembro(nombre_miembro)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Miembro '${nombre_miembro}' eliminado! txHash:`, txHash);
}

//////////////////// Ver Miembros ////////////////////
/*
  Leer datos de múltiples cuentas se hace desde el cliente, no desde el programa,
  porque es más eficiente. Obtenemos el vector de PDAs del gimnasio y luego
  consultamos los datos de cada miembro individualmente.
*/
async function verMiembros() {
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  try {
    const gimnasioAccount = await pg.program.account.gimnasio.fetch(pda_gimnasio);
    const total = gimnasioAccount.miembros.length;

    if (!gimnasioAccount.miembros || total === 0) {
      console.log("El gimnasio no tiene miembros registrados.");
      return;
    }

    console.log(`Gimnasio: ${gimnasioAccount.nombre}`);
    console.log(`Total de miembros: ${total}`);
    console.log("-------------------------------");

    for (let i = 0; i < total; i++) {
      const miembroKey = gimnasioAccount.miembros[i];
      const miembroAccount = await pg.program.account.miembro.fetch(miembroKey);

      console.log(
        `Miembro #${i + 1}:
  * Nombre: ${miembroAccount.nombre}
  * Días restantes: ${miembroAccount.diasRestantes}
  * Membresía activa: ${miembroAccount.activo}
  * PDA: ${miembroKey.toBase58()}`
      );
    }
  } catch (error) {
    console.error("Error al ver miembros:", error.message);
  }
}

//////////////////// Imports ////////////////////
import { PublicKey } from "@solana/web3.js";

////////////////// Constantes ////////////////////
const nombre_gimnasio = "MiGym"; // Cambia esto por el nombre de tu gimnasio
const owner = pg.wallet.publicKey; // Tu wallet conectada en Solana Playground

//////////////////// Client Test Logs ////////////////////
console.log("Mi dirección:", owner.toString());
const balance = await pg.connection.getBalance(owner);
console.log(`Mi balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

//////////////////// OBTENER PDAs ////////////////////
/*
  Las PDAs (Program Derived Addresses) son cuentas controladas por el programa.
  Se generan de forma determinista a partir de "semillas" (seeds).
  Usamos las mismas semillas que definimos en el programa Rust para encontrar
  la dirección correcta de cada cuenta.
*/

//////////////////// PDA Gimnasio ////////////////////
function pdaGimnasio(nombre_gym) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("gimnasio"),       // Semilla 1: b"gimnasio"
      Buffer.from(nombre_gym),       // Semilla 2: nombre del gimnasio -> String
      owner.toBuffer(),              // Semilla 3: wallet del owner -> Pubkey
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// PDA Miembro ////////////////////
function pdaMiembro(nombre_miembro) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("miembro"),        // Semilla 1: b"miembro"
      Buffer.from(nombre_miembro),   // Semilla 2: nombre del miembro -> String
      owner.toBuffer(),              // Semilla 3: wallet del owner -> Pubkey
    ],
    pg.PROGRAM_ID
  );
}

//////////////////// FUNCIONES ////////////////////

//////////////////// Crear Gimnasio ////////////////////
// Registra un nuevo gimnasio en la blockchain vinculado a tu wallet
async function crearGimnasio(nombre_gym) {
  const [pda_gimnasio] = pdaGimnasio(nombre_gym);

  const txHash = await pg.program.methods
    .crearGimnasio(nombre_gym)
    .accounts({
      owner: owner,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log("Gimnasio creado! txHash:", txHash);
}

//////////////////// Registrar Miembro ////////////////////
// Agrega un nuevo miembro con nombre y días de membresía
async function registrarMiembro(nombre_miembro, dias) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .registrarMiembro(nombre_miembro, dias)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Miembro '${nombre_miembro}' registrado! txHash:`, txHash);
}

//////////////////// Alternar Membresía ////////////////////
// Activa o desactiva la membresía de un miembro
async function alternarMembresia(nombre_miembro) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .alternarMembresia(nombre_miembro)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Membresía de '${nombre_miembro}' alternada! txHash:`, txHash);
}

//////////////////// Actualizar Días ////////////////////
// Renueva o modifica los días de membresía de un miembro
async function actualizarDias(nombre_miembro, nuevos_dias) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .actualizarDias(nombre_miembro, nuevos_dias)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Días de '${nombre_miembro}' actualizados a ${nuevos_dias}! txHash:`, txHash);
}

//////////////////// Eliminar Miembro ////////////////////
// Da de baja al miembro y cierra su cuenta (se recupera el rent)
async function eliminarMiembro(nombre_miembro) {
  const [pda_miembro] = pdaMiembro(nombre_miembro);
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  const txHash = await pg.program.methods
    .eliminarMiembro(nombre_miembro)
    .accounts({
      owner: owner,
      miembro: pda_miembro,
      gimnasio: pda_gimnasio,
    })
    .rpc();

  console.log(`Miembro '${nombre_miembro}' eliminado! txHash:`, txHash);
}

//////////////////// Ver Miembros ////////////////////
/*
  Leer datos de múltiples cuentas se hace desde el cliente, no desde el programa,
  porque es más eficiente. Obtenemos el vector de PDAs del gimnasio y luego
  consultamos los datos de cada miembro individualmente.
*/
async function verMiembros() {
  const [pda_gimnasio] = pdaGimnasio(nombre_gimnasio);

  try {
    const gimnasioAccount = await pg.program.account.gimnasio.fetch(pda_gimnasio);
    const total = gimnasioAccount.miembros.length;

    if (!gimnasioAccount.miembros || total === 0) {
      console.log("El gimnasio no tiene miembros registrados.");
      return;
    }

    console.log(`Gimnasio: ${gimnasioAccount.nombre}`);
    console.log(`Total de miembros: ${total}`);
    console.log("-------------------------------");

    for (let i = 0; i < total; i++) {
      const miembroKey = gimnasioAccount.miembros[i];
      const miembroAccount = await pg.program.account.miembro.fetch(miembroKey);

      console.log(
        `Miembro #${i + 1}:
  * Nombre: ${miembroAccount.nombre}
  * Días restantes: ${miembroAccount.diasRestantes}
  * Membresía activa: ${miembroAccount.activo}
  * PDA: ${miembroKey.toBase58()}`
      );
    }
  } catch (error) {
    console.error("Error al ver miembros:", error.message);
  }
}

