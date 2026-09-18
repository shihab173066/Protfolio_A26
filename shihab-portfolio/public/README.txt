Files in this folder are served as-is at the site root.

1. Shihab_picture.jpg — the professional photograph. It is used in two places:
                        the hero avatar on the site, and the header of the
                        generated resume PDF. Square or 4:5 portrait works best;
                        the PDF centre-crops it to a square automatically.
                        Until it exists the hero shows an initials avatar.

There is no resume PDF here any more, and none is needed. Every "Download resume"
button now builds an ATS-friendly, 2-page A4 PDF from the live site content at
click time (see src/utils/resumePdf.js), so the resume can never drift out of date
with the site.

To serve a hand-made PDF instead, set Profile -> "Resume override URL" in the admin
panel to a full https:// link. The photo path is editable in the same place.
