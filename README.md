# Mini Yellow Pages

A neighborhood directory and emergency-preparedness organizer. Collect your neighbors' contact info (with their consent), group them into small check-in **pods**, and print a booklet everyone can keep by the phone.

## What it does

- **Directory**: Add households: names, address, phones, email, occupation, emergency **skills** (nurse, electrician, ham radio, languages…), shareable **equipment** (generator, chainsaw, AED…), and "check-on-me" info: **household members** (number of adults and children, plus ages and details), special needs, and pets. Search and filter by skill ("who has a generator?").
- **Consent tracking**: Each household records whether it agreed to be listed, when, and by whom, plus which fields it's OK to print. Households without consent never appear in the booklet or pods. Organizer notes are never printed.
- **Pods**: Auto-assign consenting households into pods of up to 5 (configurable) by street and house number, so pod members are next-door neighbors. Each pod shows a headcount (people and children) so members know who to account for. You can rename pods, pick a captain, and move households by hand.
- **Map**: Enter your neighborhood address in Settings, then click **Find households on the map**. Each home gets a numbered flag, colored by pod. If a flag lands in the wrong spot, drag it. If an address can't be found, click "Place" and then click the map. The printed booklet includes a one-page **neighborhood map** with a numbered legend, and each directory listing shows its "Map #".
- **Prepare**: Guides for shutting off gas, water, and electricity; generators; earthquakes; wildfire evacuation; household plans; and the pod check-in protocol. Also an interactive go-bag checklist and important phone numbers.
- **Print**: A print-ready booklet (letter size) you can configure. It has a cover with important numbers, a directory grouped by street, a skills and resources index, pod check-off sheets, the guides, the go-bag checklist, OK/HELP window signs, and **blank sign-up and consent forms** to take door to door.
- **Import & export** (Directory tab or Settings):
  - **.json backup**: restores everything (households, pods, settings) and replaces the current data.
  - **.csv spreadsheet**: holds the same complete data as the backup. Households come first, one row each, including pod and pod captain. Below them are labeled `## Settings`, `## Important numbers` and `## Pods` sections. Importing adds households and updates any with the same name and address. Nothing is deleted. Settings, numbers and pods are restored when those sections are present. It accepts the app's own CSV export or your own spreadsheet. The first row must have column headings, including at least `names`/`name` or `address`. Common variations like "Street Address" and "Phone Number" are recognized, and tab-separated files work too.

## Privacy model

There's no server and no account. Everything is stored in the organizer's browser (`localStorage`) on one device. Nothing is uploaded. That keeps neighbors' personal information off the internet. The trade-off: **export a backup regularly**, and use the backup file to move the data to another computer or a co-organizer.

**Map exception:** the map is the only feature that uses the internet. Map tiles come from CARTO (OpenStreetMap data), and the Leaflet map library loads from unpkg. When you click **Find households on the map**, each household's *street address and city* (never names or other details) is sent to OpenStreetMap's free Nominatim address service, one per second as its usage policy requires. Map coordinates are saved with each household and included in the backup and CSV exports.

## Running it

It's a static site with no build step and no dependencies:

- Open `index.html` directly in a browser, or
- Serve the folder (`python3 -m http.server`) or host it free on GitHub Pages (Settings → Pages → deploy from branch).

## Suggested workflow

1. **Settings**: Enter your neighborhood name, organizer contact, meeting point, and local utility numbers.
2. **Print → Blank sign-up forms**: Knock on doors and collect signed forms.
3. **Directory → + Add household**: Enter each form and tick the consent box.
4. **Pods → Auto-assign by address**: Then adjust and pick captains.
5. **Print**: Print the booklet (double-sided, "headers and footers" off) and hand it out.

## Customizing

Guide text, the go-bag list, skill and equipment suggestions, and default phone numbers are in `content.js`. The guides are general guidance. Check them against your local utility and emergency-management agency.

## Files

- `index.html`: page shell
- `app.js`: app logic (directory, editor, pods, print booklet, import/export)
- `content.js`: editable content (guides, checklists, suggestions, sample data)
- `styles.css`: screen and print styles
