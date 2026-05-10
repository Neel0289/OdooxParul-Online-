# ✈️ Traveloop - Smart Travel Planning Platform

A full-stack travel planning application built with Django, React, and modern web technologies. Plan multi-city trips, manage budgets, discover activities, and share your adventures with friends.

## 🎯 Features

### Core Features
- 🗺️ **Multi-City Itineraries** - Create detailed itineraries with multiple stops
- 💰 **Budget Tracking** - Track expenses by category and monitor spending
- 🎯 **Activity Discovery** - Find and add activities to each stop
- 📋 **Packing Checklist** - Smart checklist with categories
- 📝 **Trip Journal** - Take notes during your travels
- 🌍 **Interactive Maps** - Visualize your trip routes on OpenStreetMap
- 👥 **Share & Collaborate** - Share trips with friends and get feedback
- 💳 **Easy Booking** - Integration-ready for flights and hotels

### Premium UI Features
- ✨ Glassmorphism effects
- 🎨 Beautiful gradients and animations
- 📱 Fully responsive design
- 🚀 Smooth page transitions (Framer Motion)
- ⚡ Fast loading with Vite
- 🎯 Professional cards and layouts

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
# Navigate to project root
cd d:\Hackathons\ParulxOdoo

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate

# Install Python dependencies
pip install django djangorestframework django-cors-headers python-dotenv pillow python-dateutil

# Apply database migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser --username admin --email admin@example.com

# Start Django server
python manage.py runserver
```

Backend will run at: http://localhost:8000/

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: http://localhost:5173/

## 📱 Architecture

```
Traveloop/
├── Django Backend
│   ├── Models (Trip, Stop, Activity, Budget, etc.)
│   ├── REST API (DRF ViewSets)
│   ├── Serializers
│   └── Authentication
│
└── React Frontend
    ├── Pages (Dashboard, TripList, etc.)
    ├── Components (Layout, Cards, etc.)
    ├── Styles (Tailwind CSS)
    └── Animations (Framer Motion)
```

## 🔑 API Documentation

### Authentication
```
POST   /api/register/              # Register new user
POST   /api-auth/login/            # User login
```

### Trips
```
GET    /api/trips/                 # List all trips
POST   /api/trips/                 # Create new trip
GET    /api/trips/{id}/            # Get trip details
PUT    /api/trips/{id}/            # Update trip
DELETE /api/trips/{id}/            # Delete trip
POST   /api/trips/{id}/share/      # Generate share link
POST   /api/trips/{id}/copy/       # Copy trip
```

### Stops & Activities
```
POST   /api/trips/{id}/stops/                  # Add stop
POST   /api/trips/{id}/stops/{stop_id}/activities/  # Add activity
PUT    /api/stops/{stop_id}/                   # Update stop
DELETE /api/stops/{stop_id}/                   # Delete stop
```

### Budget & Other Features
```
GET    /api/trips/{id}/budget/     # Get budget breakdown
POST   /api/trips/{id}/budget/     # Add budget item
GET    /api/trips/{id}/packing/    # Get packing list
POST   /api/trips/{id}/notes/      # Add note
```

## 🗄️ Database Models

### Trip
- User relationship
- Title, description
- Start/end dates
- Cover photo
- Total budget
- Public/private status

### Stop (City)
- Trip relationship
- City name, country
- Coordinates (latitude, longitude)
- Arrival/departure dates
- Cost index
- Order in itinerary

### Activity
- Stop relationship
- Title, description
- Category (sightseeing, food, adventure, etc.)
- Cost, duration
- Image URL
- Scheduled time

### Budget
- Trip relationship
- Category (transport, accommodation, food, etc.)
- Estimated vs actual cost
- Notes

### PackingItem
- Trip relationship
- Item name
- Category
- Packed status

### Note
- Trip or Stop relationship
- Content, timestamp

### TripShare
- Trip relationship
- Unique share token
- Public/private status

## 🎨 UI Components

### Layout
- **Navbar** - Sticky header with user menu
- **Sidebar** - Navigation with collapsible menu
- **Cards** - Trip cards with hover effects
- **Modals** - Forms and dialogs
- **Buttons** - Gradient buttons with hover states

### Features
- **Glassmorphism** - Frosted glass effect
- **Animations** - Framer Motion staggered animations
- **Gradients** - Beautiful color gradients
- **Responsive** - Mobile-first design
- **Shadows** - Soft box shadows
- **Icons** - Lucide React icons

## 🔧 Development

### Adding a New Feature

1. **Backend**
   ```python
   # models.py - Add model
   class NewModel(models.Model):
       field = models.CharField(max_length=255)
   
   # serializers.py - Add serializer
   class NewModelSerializer(serializers.ModelSerializer):
       class Meta:
           model = NewModel
           fields = '__all__'
   
   # views.py - Add viewset
   class NewModelViewSet(viewsets.ModelViewSet):
       queryset = NewModel.objects.all()
       serializer_class = NewModelSerializer
   
   # urls.py - Register route
   router.register(r'newmodels', views.NewModelViewSet)
   ```

2. **Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Frontend**
   ```jsx
   // Create component
   import React from 'react'
   const NewFeature = () => {
     return <div>New Feature</div>
   }
   export default NewFeature
   ```

## 📊 Tech Stack

### Backend
- **Framework**: Django 4.2
- **API**: Django REST Framework 3.14
- **Database**: SQLite (development), MySQL (production-ready)
- **Authentication**: DRF Session Auth
- **Image Processing**: Pillow
- **CORS**: django-cors-headers

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **Routing**: React Router 6
- **Icons**: Lucide React
- **Charts**: Recharts
- **Maps**: React Leaflet (Leaflet.js)

## 🌐 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Environment Variables

Create a `.env` file in the root:
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

## 🔐 Security

- CSRF protection (Django built-in)
- Password hashing (Django built-in)
- CORS configuration
- SQL injection prevention (Django ORM)
- XSS prevention (template escaping)

## 📚 Project Structure

```
d:\Hackathons\ParulxOdoo/
├── traveloop/                 # Django project
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── trips/                     # Main app
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── frontend/                  # React app
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── manage.py
├── db.sqlite3
└── README.md
```

## 🐛 Troubleshooting

### CORS Issues
- Check `CORS_ALLOWED_ORIGINS` in `traveloop/settings.py`
- Add your frontend URL

### Database Issues
- Run `python manage.py migrate`
- Reset migrations if needed

### Frontend Won't Load
- Check if both servers are running
- Clear browser cache
- Check browser console for errors

### API Not Responding
- Verify backend is running on port 8000
- Check authentication token in localStorage
- Review Django error logs

## 📞 Admin Panel

Access at: http://localhost:8000/admin/

**Credentials:**
- Username: admin
- Password: admin123

Manage:
- Users and profiles
- Trips and stops
- Activities and budgets
- Packing items
- Trip shares

## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Configure database (MySQL/PostgreSQL)
- [ ] Set secure `SECRET_KEY`
- [ ] Configure allowed hosts
- [ ] Set up static files serving
- [ ] Enable HTTPS
- [ ] Configure CDN for media
- [ ] Set up email backend
- [ ] Create admin user
- [ ] Run security checks

### Suggested Hosting
- Backend: Heroku, Railway, DigitalOcean
- Frontend: Vercel, Netlify, CloudFlare
- Database: PostgreSQL on managed service
- Storage: S3, Azure Blob, or similar

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project

## 🙏 Acknowledgments

- Django & Django REST Framework teams
- React team
- Tailwind CSS
- Framer Motion
- OpenStreetMap
- All contributors

## 📞 Support

For issues and questions:
1. Check existing documentation
2. Review API docs
3. Check Django admin panel
4. Review browser console for errors
5. Check terminal logs

---

**Made with ❤️ for travelers everywhere**

Last Updated: 2024-05-10
