import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late GoogleMapController mapController;
  final Set<Marker> _markers = {};
  bool _isLoading = true;
  bool _locationPermissionGranted = false;

  static const LatLng _center = LatLng(39.2061, 26.8524); // Dikili Center

  @override
  void initState() {
    super.initState();
    _checkLocationPermission();
    _loadLocations();
  }

  Future<void> _checkLocationPermission() async {
    // Note: In a real app, use permission_handler package.
    // For now, we'll try to enable it and catch errors.
    setState(() {
      _locationPermissionGranted = true; 
    });
  }

  Future<void> _loadLocations() async {
    try {
      final locations = await ApiService.getMapLocations();
      setState(() {
        for (var loc in locations) {
          final double? lat = loc['latitude']?.toDouble();
          final double? lng = loc['longitude']?.toDouble();
          
          if (lat != null && lng != null) {
            _markers.add(
              Marker(
                markerId: MarkerId(loc['id'].toString()),
                position: LatLng(lat, lng),
                infoWindow: InfoWindow(
                  title: loc['name'] ?? 'İşletme',
                  snippet: loc['description'] ?? '',
                ),
                icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
              ),
            );
          }
        }
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Konumlar yüklenemedi: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GHOST GEAR RADAR', style: TextStyle(letterSpacing: 2)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          GoogleMap(
            onMapCreated: (controller) => mapController = controller,
            initialCameraPosition: const CameraPosition(
              target: _center,
              zoom: 14.0,
            ),
            markers: _markers,
            myLocationEnabled: _locationPermissionGranted,
            myLocationButtonEnabled: _locationPermissionGranted,
            style: _mapStyle, // Cyberpunk/Dark map style
          ),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: AppTheme.gold),
            ),
          // Custom Radar UI Elements
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface.withOpacity(0.9),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.gold.withOpacity(0.3)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildStatItem(Icons.speed, '0', 'KM/H'),
                  _buildStatItem(Icons.explore, 'N', 'YÖN'),
                  _buildStatItem(Icons.people, '12', 'BİKER'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value, String unit) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: AppTheme.gold, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        Text(
          unit,
          style: const TextStyle(fontSize: 10, color: Colors.white54),
        ),
      ],
    );
  }

  final String _mapStyle = '''
  [
    {
      "elementType": "geometry",
      "stylers": [{"color": "#212121"}]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#757575"}]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{"color": "#121212"}]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{"color": "#000000"}]
    }
  ]
  ''';
}
