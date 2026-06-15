# How Admin Image Upload Works

## Step 1: Create a `.env` file in Backend

Copy `.env.example` to `.env` and customize:
```
MONGODB_URI=mongodb://127.0.0.1:27017/afra-crafts
FRONTEND_URL=http://localhost:5173
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword
```

## Step 2: Start the Backend

```bash
cd Backend
npm install
npm run dev
```

- The admin user is auto-created with credentials from `.env`
- MongoDB connection is established

## Step 3: Start the Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Step 4: Login as Admin

1. Go to `http://localhost:5173`
2. Enter username: `admin`
3. Enter password: (from your `.env` ADMIN_PASSWORD)
4. Click "Login"

## Step 5: Upload Images

1. Click the "Portal" link in the header
2. In the "Admin controls" section:
   - Enter product details (name, price, description)
   - Select a category
   - **Click "Upload image from phone/computer"**
   - Choose a photo from your phone or computer
   - Click "Add product"

The image is now stored in MongoDB as base64 and appears in the shop!

## Database Storage

- **imageData**: base64 string of the uploaded file (stored in MongoDB)
- **imageUrl**: placeholder for external URLs (if needed)
- **imageKey**: reference to preset images (optional)

## To Change Admin Credentials

1. Edit `Backend/.env`:
   ```
   ADMIN_USERNAME=newadmin
   ADMIN_PASSWORD=newpassword
   ```
2. Restart the backend
3. The next login will use the new credentials

## To View Database

Using MongoDB Compass or CLI:
```
mongosh

use afra-crafts

# See all users
db.users.find()

# See all products with images
db.products.find()

# See a single product image data
db.products.find({}, { name: 1, imageData: 1 }).limit(1)
```

## Why Nothing in DB Before?

- On first start, backend creates a default admin user
- No products exist until you add them through the portal
- Users are created when they log in
- Data persists between restarts (stored in MongoDB)
