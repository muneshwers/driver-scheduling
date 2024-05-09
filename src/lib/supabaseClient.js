
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ommcizbpubwggxnozhgl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbWNpemJwdWJ3Z2d4bm96aGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI4NTk5NzEsImV4cCI6MjAyODQzNTk3MX0.7f2_7xOI242vHV2f2Wh273RG8CQUsniGHEbejfXDKpk";
let environ = "development"; //Options "development" and "production"
let defaultSchema = "public"

if (environ == "development") {
    defaultSchema = "testing";
}

console.log(`[lib/supabaseClient.js] Running on ${environ} environment using the ${defaultSchema} schema.`)

export const supabase = createClient(supabaseUrl, supabaseKey, {db: { schema: defaultSchema}});
        