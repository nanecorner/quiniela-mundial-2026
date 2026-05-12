'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    redirect('/?error=' + encodeURIComponent(error.message))
  }

  redirect('/?message=' + encodeURIComponent('Se ha enviado un correo para restablecer tu contraseña.'))
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string

  const { data: whitelistData, error: whitelistError } = await supabase
    .from('whitelist')
    .select('email')
    .eq('email', email.toLowerCase())
    .single()

  if (whitelistError || !whitelistData) {
    redirect('/?error=' + encodeURIComponent('Este correo no está en la lista de invitados autorizados. Por favor contacta al administrador.'))
  }

  const data = {
    email: email,
    password: formData.get('password') as string,
    options: {
      data: {
        name: name,
      }
    }
  }

  const { data: signUpData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/?error=' + encodeURIComponent(error.message))
  }

  // El perfil se creará automáticamente en BD mediante el trigger on_auth_user_created

  // Si se requiere confirmación de email, la sesión vendrá nula
  if (!signUpData.session) {
    redirect('/?message=' + encodeURIComponent('¡Registro exitoso! Por favor revisa tu correo (incluyendo la carpeta de SPAM) para confirmar tu cuenta.'))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Las contraseñas no coinciden.'))
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/auth/reset-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/?message=' + encodeURIComponent('Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión.'))
}

