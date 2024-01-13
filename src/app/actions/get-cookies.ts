"use server"
import { cookies } from "next/headers"

export default async function getCookies() {
   const token = cookies().get('token')
   return token
}