import type { TFunction } from 'i18next'
import { z } from 'zod'

export function signInSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  })
}

export function signUpSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid')),
    password: z.string().min(6, t('validation.passwordTooShort')),
  })
}

export function forgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid')),
  })
}

export function resetPasswordSchema(t: TFunction) {
  return z.object({
    password: z.string().min(6, t('validation.passwordTooShort')),
  })
}
