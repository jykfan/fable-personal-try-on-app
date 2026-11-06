# Mini Yellow Pages

A neighborhood directory and emergency-preparedness organizer. Collect your neighbors' contact info (with their consent), group them into small check-in **pods**, and print a booklet everyone can keep by the phone.

## What it does

- **Directory**: Add households: names, address, phones, email, occupation, household members, emergency **skills** (nurse, electrician, ham radio, languages…), shareable **equipment** (generator, chainsaw, AED…), special needs, and pets. Search and filter by skill ("who has a generator?").
- **Consent tracking**: Each household records whether it agreed to be listed, when, and by whom, plus which fields it's OK to print. Households without consent never appear in the booklet or pods. Organizer notes are never printed.
- **Pods**: Auto-assign consenting households into pods of up to 5 (configurable) by street and house number, so pod members are next-door neighbors. You can rename pods, pick a captain, and move households by hand.
- **Prepare**: Guides for shutting off gas, water, and electricity; generators; earthquakes; wildfire evacuation; household plans; and the pod check-in protocol. Also an interactive go-bag checklist and important phone numbers.
- **Print**: A print-ready booklet (letter size) you can configure. It has a cover with important numbers, a directory grouped by street, a skills and resources index, pod check-off sheets, the guides, the go-bag checklist, OK/HELP window signs, and **blank sign-up and consent forms** to take door to door.
- **Data**: Export/import a JSON backup and export a CSV spreadsheet.

## Privacy model

There's no server and no account. Everything is stored in the organizer's browser (`localStorage`) on one device. Nothing is uploaded. That keeps neighbors' personal information off the internet. The trade-off: **export a backup regularly**, and use the backup file to move the data to another computer or a co-organizer.

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
