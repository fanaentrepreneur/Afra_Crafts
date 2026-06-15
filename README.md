# Afra Crafts

A craft business website with a user shopping page and an admin dashboard.

## Structure

- `Frontend/` - React + Vite website
- `Backend/` - Node.js + Express API with MongoDB support

## Setup

### Backend

1. Open a terminal in `Backend/`
2. Run `npm install`
3. Create a `.env` file based on `.env.example`
4. **Change admin credentials in `.env`** (optional):
   - `ADMIN_USERNAME=admin` - change to any username
   - `ADMIN_PASSWORD=craftadmin` - change to a secure password
5. Start the server:
   - `npm run dev`

### Frontend

1. Open a terminal in `Frontend/`
2. Run `npm install`
3. Create a `.env` file (optional, API URL defaults to `http://localhost:5000/api`)
4. Start the site:
   - `npm run dev`

## Notes

- Admin username: `admin`
- Admin password: `craftadmin`
- Category limit: 5 categories
- Product limit: 5 products per category
- Premium message appears when a category reaches 5 photos
- Images are loaded from `Frontend/assests` using the included craft photos
- Update the WhatsApp phone number in `Frontend/src/HomePage.jsx`

## MongoDB

Use either a local MongoDB instance or a free Atlas cluster.

- Set `MONGODB_URI` in `Backend/.env`
- If using a local server, the default connection is `mongodb://127.0.0.1:27017/afra-crafts`

## Adding images

**Admin can upload images in two ways:**

1. **Upload from phone/computer** (recommended)
   - Click "Upload image from phone/computer" in the admin panel
   - Select an image file (JPEG, PNG, etc.)
   - The image is converted to base64 and stored in MongoDB

2. **Use preset images** (from `Frontend/assests` folder)
   - Select from the dropdown "Image reference"
   - These are built-in sample images

**How images are stored in the database:**
- Each product has an `imageData` field (base64-encoded image)
- The image is stored directly in MongoDB as text
- When a product is displayed, the base64 image is shown

**Database structure:**
- Products: `name`, `price`, `description`, `categoryId`, `imageData`, `imageUrl`, `imageKey`
- Categories: `name`, `slug`, `description`
- Users: `username`, `fullName`, `role` (admin or user)

**To check what's in the database:**
Use MongoDB Compass or the mongo CLI:
```
use afra-crafts
db.users.find()           # See all users (admin + registered users)
db.products.find()        # See all products
db.categories.find()      # See all categories
```
