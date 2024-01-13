'use client'

import { useAuth } from "../useAuth"

export const ClientComponent = () => {
  const {initialized } = useAuth()

  console.log(initialized)


  return null

}