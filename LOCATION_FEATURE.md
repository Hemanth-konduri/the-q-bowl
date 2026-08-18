# Location Picker & Delivery Routes Feature

## Overview
This feature allows users to select their exact delivery location on a map and provides delivery staff with route information.

## Files Created

### Components
1. **`/src/components/location-picker.tsx`** - Map-based location picker for users
   - Search location by typing
   - Click on map to select
   - Use current location
   - Shows address via reverse geocoding

2. **`/src/components/delivery-route.tsx`** - Delivery route display for delivery staff
   - Shows route from kitchen to customer
   - Distance & estimated time
   - Green marker (kitchen) + Red marker (customer)
   - Route line on map

### Pages
3. **`/src/app/user/checkout/page.tsx`** - User checkout with location picker
4. **`/src/app/user/delivery/routes/page.tsx`** - Delivery staff route view
5. **`/src/app/admin/delivery/routes/page.tsx`** - Admin route view

## Setup Required

### Get Free OpenRouteService API Key

1. Go to https://openrouteservice.org/
2. Sign up (free, no payment needed)
3. Get your API key from dashboard
4. Add to `.env.local`:
   ```
   OPENROUTE_API_KEY=your_api_key_here
   ```

## Features

### For Users (Checkout)
- ✅ Search location by typing
- ✅ Click on map to select exact location
- ✅ Use current location (GPS)
- ✅ See delivery info (time, fee)

### For Delivery Staff
- ✅ View route from kitchen to customer
- ✅ See distance & estimated time
- ✅ Map with markers and route line

## How It Works

1. **User selects location** on checkout page
2. **Coordinates saved** to address (latitude/longitude)
3. **Delivery staff sees route** from kitchen to customer
4. **OpenRouteService API** calculates actual route (if key provided)
5. **Fallback calculation** uses straight-line distance if no API key

## Database

The `addresses` table already has `latitude` and `longitude` fields.

The `delivery_areas` table has:
- `kitchenLat` - Kitchen location latitude
- `kitchenLng` - Kitchen location longitude  
- `radius` - Delivery radius in km

## Free Tier Limits

OpenRouteService: 50,000 requests/month (free)
