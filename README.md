# Southside Dinkers — Fresh Start Guide

Good news: your **database is already fully set up** in Supabase (all three
migrations have been run). This folder already has your `.env` file and
your GCash details filled in. You should NOT need to edit any code files.

Just follow these steps exactly, in order.

## Step 1: Delete your old project folder

Find your old `southside-dinkers-booking-app` folder (wherever you had it
before) and delete it completely, or just move it to the Recycle Bin.
We're starting clean so there's no confusion with old edits.

## Step 2: Unzip this new folder

1. Find the file `southside-dinkers-booking-app.zip` you just downloaded
2. Right-click it → **Extract All...** → choose a location (Desktop is fine) → **Extract**
3. Open the new extracted folder. You should see: `src`, `public`, `sql`,
   `.env`, `package.json`, and a few other files sitting directly inside it.

## Step 3: Add your GCash QR photo

Your GCash *name and number* are already in the code. You just need to add
the actual QR *image*:

1. Find your GCash QR code photo on your computer
2. Rename it to exactly: `gcash-qr.jpg`
3. Move it into the `public` folder inside your newly extracted project

## Step 4: Open Command Prompt and run it

1. Press the Windows key, type `Command Prompt`, press Enter
2. Type `cd ` (with a space), then drag your extracted project folder into
   the window, then press Enter. Your prompt should now show the project's
   path.
3. Type this and press Enter:
   ```
   npm install
   ```
   Wait for it to finish (a minute or two, lots of scrolling text is normal).
4. Type this and press Enter:
   ```
   npm run dev
   ```
5. Once you see a line like `Local: http://localhost:5173/`, **stop
   touching that window**. Leave it running.

## Step 5: Test it

Open your browser and go to:
```
localhost:5173
```

Click through a full test booking: pick a date, pick a time, fill in your
details, and on the payment step upload any test image as "proof of
payment," then click Confirm booking.

If anything looks wrong or shows an error, take a screenshot and send it —
don't try to fix code files directly. Send me the screenshot and I'll tell
you exactly what to do.

## What's already done, so you don't need to redo it:

- ✅ Supabase database created, with all 3 migrations run
- ✅ GCash name and number filled into the code
- ✅ `.env` file filled in with your real Supabase credentials
- ✅ White background, larger fonts, no Extras step, Facebook name field,
  screenshot upload for payment proof, double-booking protection

## What's left after this works:

- Putting it online for real (a public link, via GitHub + Vercel) — we'll
  do this together once local testing looks good.
