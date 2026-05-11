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

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  const data = {
    email: formData.get('email') as string,
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

