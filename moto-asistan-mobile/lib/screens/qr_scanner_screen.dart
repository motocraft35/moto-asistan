import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          'KOD_TARAYICI',
          style: GoogleFonts.outfit(fontWeight: FontWeight.black, fontStyle: FontStyle.italic),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  Navigator.pop(context, barcode.rawValue);
                }
              }
            },
          ),
          // Scanner Overlay
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.cyan.withOpacity(0.5), width: 2),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Stack(
                children: [
                  // Corner accents
                  _buildCorner(0, 0, 20, 0, 0, 20),
                  _buildCorner(null, 0, 0, 20, 0, 20),
                  _buildCorner(0, null, 20, 0, 20, 0),
                  _buildCorner(null, null, 0, 20, 20, 0),
                  
                  // Scanning line animation placeholder
                  const Center(
                    child: Icon(Icons.qr_code_2, color: Colors.cyan, size: 100, opacity: 0.2),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white10),
                ),
                child: const Text(
                  'BİLET KODUNU ÇERÇEVEYE HİZALAYIN',
                  style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCorner(double? left, double? top, double? right, double? bottom, double horizontal, double vertical) {
    return Positioned(
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          border: Border(
            left: left == 0 ? BorderSide(color: Colors.cyan, width: 4) : BorderSide.none,
            top: top == 0 ? BorderSide(color: Colors.cyan, width: 4) : BorderSide.none,
            right: right == 0 ? BorderSide(color: Colors.cyan, width: 4) : BorderSide.none,
            bottom: bottom == 0 ? BorderSide(color: Colors.cyan, width: 4) : BorderSide.none,
          ),
        ),
      ),
    );
  }
}
