// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, username, full_name } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Create a Supabase client with the SERVICE_ROLE_KEY
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, // same project URL
      process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key (only used on server)
    )

    // Step 1: create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirmed`, // success page
        // prevent Supabase from returning a session right away
        // (user won’t be logged in automatically)
        // NOTE: depends on SDK version, but session won’t persist unless you explicitly set it
      },
    })

    // const { data, error } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: {
    //     data: { username, full_name },
    //   },
    // })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const user = data.user
    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Step 2: insert into profiles
    await supabase.from("profiles").insert({
      id: user.id,
      username,
      full_name,
    })

    // Step 3: insert default user_settings
    await supabase.from("user_settings").insert({
      user_id: user.id,
      work_duration: 1500,
      short_break_duration: 300,
      long_break_duration: 1800,
      sessions_until_long_break: 4,
      auto_start_breaks: false,
      auto_start_pomodoros: false,
      theme: "default",
      notification_sound: "bell",
      break_sound: "chime",
      master_volume: 0.7,
      notification_volume: 0.8,
      music_volume: 0.5,
      ambient_volume: 0.3,
      spotify_enabled: false,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error("Registration error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}




// // src/app/api/auth/register/route.ts
// import { NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";

// export async function POST(req: Request) {
//   const supabase = createClient();
//   const body = await req.json();
//   const { email, password } = body;

//   if (!email || !password) {
//     return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
//   }

//   // Create auth user
//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//   });

//   if (error) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }

//   return NextResponse.json({ user: data.user }, { status: 201 });
// }
