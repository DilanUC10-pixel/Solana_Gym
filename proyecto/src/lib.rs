use anchor_lang::prelude::*;

declare_id!("EGH5y6Wop2mZCy3cotva39C2fXLnyrkC5kFQ9M3B2Ror"); // Reemplaza con tu program ID al deployar

#[program] // El programa comienza aquí
pub mod gymchain {
    use super::*;

    /////////////////////////// INSTRUCCIONES ///////////////////////////

    /////////////////////////// Crear Gimnasio ///////////////////////////
    /// Registra un nuevo gimnasio en la blockchain.
    /// Solo el owner puede administrarlo después.
    pub fn crear_gimnasio(context: Context<NuevoGimnasio>, nombre: String) -> Result<()> {
        let owner_id = context.accounts.owner.key();

        let miembros = Vec::<Pubkey>::new(); // Lista vacía de miembros al inicio

        context.accounts.gimnasio.set_inner(Gimnasio {
            owner: owner_id,
            nombre: nombre.clone(),
            miembros,
        });

        msg!(
            "Gimnasio '{}' creado exitosamente! Owner: {}",
            nombre,
            owner_id
        );

        Ok(())
    }

    /////////////////////////// Registrar Miembro ///////////////////////////
    /// Agrega un nuevo miembro al gimnasio con su plan de membresía.
    /// Solo el owner del gimnasio puede registrar miembros.
    pub fn registrar_miembro(
        context: Context<NuevoMiembro>,
        nombre: String,
        dias_restantes: u16,
    ) -> Result<()> {
        // Solo el owner del gimnasio puede registrar miembros
        require!(
            context.accounts.gimnasio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let miembro = Miembro {
            gimnasio: context.accounts.gimnasio.nombre.clone(),
            nombre: nombre.clone(),
            dias_restantes,
            activo: true, // Al registrarse, la membresía comienza activa
        };

        context.accounts.miembro.set_inner(miembro);

        // Guardamos la referencia (PDA) del miembro en el gimnasio
        context
            .accounts
            .gimnasio
            .miembros
            .push(context.accounts.miembro.key());

        msg!(
            "Miembro '{}' registrado en '{}' con {} días de membresía. Owner: {}",
            nombre,
            context.accounts.gimnasio.nombre,
            dias_restantes,
            context.accounts.owner.key()
        );

        Ok(())
    }

    /////////////////////////// Eliminar Miembro ///////////////////////////
    /// Da de baja a un miembro del gimnasio y cierra su cuenta.
    /// Solo el owner puede eliminar miembros.
    pub fn eliminar_miembro(context: Context<EliminarMiembro>, nombre: String) -> Result<()> {
        require!(
            context.accounts.gimnasio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let gimnasio = &mut context.accounts.gimnasio;

        // Verificamos que el miembro pertenece a este gimnasio
        require!(
            context.accounts.miembro.gimnasio == gimnasio.nombre,
            Errores::MiembroNoPerteneceAlGimnasio
        );

        require!(
            gimnasio.miembros.contains(&context.accounts.miembro.key()),
            Errores::MiembroNoExiste
        );

        // Buscamos la posición del miembro en el vector
        let pos = gimnasio
            .miembros
            .iter()
            .position(|&x| x == context.accounts.miembro.key())
            .ok_or(Errores::MiembroNoExiste)?;

        gimnasio.miembros.remove(pos);

        // La cuenta del miembro se cierra automáticamente por Anchor (close = owner)
        msg!(
            "Miembro '{}' eliminado del gimnasio '{}'. Owner: {}",
            nombre,
            gimnasio.nombre,
            context.accounts.owner.key()
        );

        Ok(())
    }

    /////////////////////////// Alternar Membresía ///////////////////////////
    /// Activa o desactiva la membresía de un miembro (ej: si no ha pagado).
    /// Solo el owner puede modificar el estado.
    pub fn alternar_membresia(context: Context<ModificarMiembro>, nombre: String) -> Result<()> {
        require!(
            context.accounts.gimnasio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let miembro = &mut context.accounts.miembro;
        let nuevo_estado = !miembro.activo;
        miembro.activo = nuevo_estado;

        msg!(
            "Membresía de '{}' actualizada a: {}",
            nombre,
            if nuevo_estado { "ACTIVA" } else { "INACTIVA" }
        );

        Ok(())
    }

    /////////////////////////// Actualizar Días ///////////////////////////
    /// Actualiza los días restantes de la membresía de un miembro (ej: renovación).
    /// Solo el owner puede actualizar los días.
    pub fn actualizar_dias(
        context: Context<ModificarMiembro>,
        nombre: String,
        nuevos_dias: u16,
    ) -> Result<()> {
        require!(
            context.accounts.gimnasio.owner == context.accounts.owner.key(),
            Errores::NoEresElOwner
        );

        let miembro = &mut context.accounts.miembro;
        miembro.dias_restantes = nuevos_dias;

        msg!(
            "Días de membresía de '{}' actualizados a: {} días",
            nombre,
            nuevos_dias
        );

        Ok(())
    }
}

/////////////////////////// CÓDIGOS DE ERROR ///////////////////////////
#[error_code]
pub enum Errores {
    #[msg("Error: no eres el propietario del gimnasio")]
    NoEresElOwner,
    #[msg("Error: el miembro no existe en este gimnasio")]
    MiembroNoExiste,
    #[msg("Error: el miembro no pertenece a este gimnasio")]
    MiembroNoPerteneceAlGimnasio,
}

/////////////////////////// STRUCTS / CUENTAS ///////////////////////////

/// Cuenta principal del gimnasio.
/// Se crea una vez por owner y guarda la lista de PDAs de sus miembros.
#[account]
#[derive(InitSpace)]
pub struct Gimnasio {
    pub owner: Pubkey, // Wallet del dueño del gimnasio

    #[max_len(60)]
    pub nombre: String, // Nombre del gimnasio

    #[max_len(50)]
    pub miembros: Vec<Pubkey>, // Lista de PDAs de miembros (máx 50)
}

/// Cuenta de cada miembro del gimnasio.
/// Se crea una PDA única por miembro usando su nombre y el owner como seeds.
#[account]
#[derive(InitSpace)]
pub struct Miembro {
    #[max_len(60)]
    pub gimnasio: String, // Nombre del gimnasio al que pertenece

    #[max_len(60)]
    pub nombre: String, // Nombre del miembro

    pub dias_restantes: u16, // Días de membresía restantes

    pub activo: bool, // Si la membresía está activa o no
}

/////////////////////////// CONTEXTOS ///////////////////////////

/// Contexto para crear un gimnasio.
/// PDA: ["gimnasio", nombre, owner_pubkey]
#[derive(Accounts)]
#[instruction(nombre: String)]
pub struct NuevoGimnasio<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Gimnasio::INIT_SPACE,
        seeds = [b"gimnasio", nombre.as_bytes(), owner.key().as_ref()],
        bump
    )]
    pub gimnasio: Account<'info, Gimnasio>,

    pub system_program: Program<'info, System>,
}

/// Contexto para registrar un miembro en el gimnasio.
/// PDA del miembro: ["miembro", nombre, owner_pubkey]
#[derive(Accounts)]
#[instruction(nombre: String)]
pub struct NuevoMiembro<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Miembro::INIT_SPACE,
        seeds = [b"miembro", nombre.as_bytes(), owner.key().as_ref()],
        bump
    )]
    pub miembro: Account<'info, Miembro>,

    #[account(mut)]
    pub gimnasio: Account<'info, Gimnasio>,

    pub system_program: Program<'info, System>,
}

/// Contexto para modificar un miembro (alternar membresía o actualizar días).
#[derive(Accounts)]
pub struct ModificarMiembro<'info> {
    pub owner: Signer<'info>,

    #[account(mut)]
    pub miembro: Account<'info, Miembro>,

    #[account(mut)]
    pub gimnasio: Account<'info, Gimnasio>,
}

/// Contexto para eliminar un miembro.
/// Al cerrarse la cuenta (close = owner), el rent se devuelve al owner.
#[derive(Accounts)]
pub struct EliminarMiembro<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        constraint = miembro.gimnasio == gimnasio.nombre @ Errores::MiembroNoPerteneceAlGimnasio
    )]
    pub miembro: Account<'info, Miembro>,

    #[account(mut)]
    pub gimnasio: Account<'info, Gimnasio>,
}
