live-link:- https://assignment-no-12-115fa.web.app/

admin-email: soulmateadmin@gmail.com

admin-password: Pa$$w0rd!

client-side:- https://github.com/MdSaifulIslamRafsan/SOULMATE-client-side

## Overview
The server-side of the matrimony website project is designed to handle data management and external integrations to ensure a seamless and secure user experience.


## Installation

- Clone the Repository:

```sh
git clone https://github.com/MdSaifulIslamRafsan/SOULMATE-server-side.git
cd SOULMATE-server-side
```

- Install Dependencies:

```sh
npm install
```

- Set Up Environment Variables:
  
Create a .env file in the root directory with the following variables:

```sh
# MongoDB Configuration
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# Authentication Token Secret
ACCESS_TOKEN_SECRET=your_access_token_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
```
- Start the Development Server:

```sh
nodemon index.js
```

## Features

1. **Payment Gateway Integration**
   - Secure Payment Processing: Allows for safe transactions for premium memberships and service fees.
     
2. **Admin Dashboard**
   - User Management: Admins can manage user roles, approve biodata and contact requests, and oversee the entire platform.

3. **Advanced Search Options**
   - Profile Sorting: Users can sort profiles by age and marriage date.
   - Custom Search: Users can search profiles by age range, profile type, and division.


## Technologies Used
- Frontend: React , tailwind
- Backend: Express
- Database: MongoDB
- Payment Gateway: Stripe
- Hosting & Authentication: Firebase
- Image Hosting: imgBB
- Token Management: JWT (JSON Web Tokens)
