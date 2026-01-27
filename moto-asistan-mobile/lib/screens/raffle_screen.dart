import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';
import 'qr_scanner_screen.dart';

class RaffleScreen extends StatefulWidget {
  const RaffleScreen({super.key});

  @override
  State<RaffleScreen> createState() => _RaffleScreenState();
}

class _RaffleScreenState extends State<RaffleScreen> {
  final TextEditingController _codeController = TextEditingController();
  bool _isLoading = false;

  void _claimCode() async {
    setState(() => _isLoading = true);
    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('KOD_DOĞRULANDI // BİLET_TANIMLANDI'),
          backgroundColor: Colors.emerald,
        ),
      );
      _codeController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(
          'ŞANSLI_ÇEKİLİŞ',
          style: GoogleFonts.outfit(fontWeight: FontWeight.black, fontStyle: FontStyle.italic),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoCard(),
            const SizedBox(height: 32),
            Text(
              'KATILIM_KODU_GİRİŞİ',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.black,
                letterSpacing: 2,
                color: Colors.white.withOpacity(0.3),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _codeController,
              decoration: InputDecoration(
                hintText: 'XYZ-123-ABC',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.qr_code_scanner, color: Colors.amber),
                  onPressed: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const QRScannerScreen()),
                    );
                    if (result != null && result is String) {
                      setState(() => _codeController.text = result);
                      _claimCode();
                    }
                  },
                ),
              ),
              style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _claimCode,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.amber),
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.black)
                  : const Text('BİLETİ_TANIMLA', style: TextStyle(fontWeight: FontWeight.black)),
              ),
            ),
            const SizedBox(height: 48),
            Text(
              'BİLETLERİM',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.black,
                letterSpacing: 2,
                color: Colors.white.withOpacity(0.3),
              ),
            ),
            const SizedBox(height: 16),
            _buildTicketItem('GHOST_SUMMER_24', '15.06.2024', Colors.cyan),
            _buildTicketItem('STREET_WARRIOR_XT', '12.06.2024', Colors.purple),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.amber.withOpacity(0.1), Colors.orange.withOpacity(0.05)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.amber.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.stars, color: Colors.amber),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AKTİF_KAMPANYA',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber),
                    ),
                    Text(
                      'KAWASAKI NINJA H2R ÇEKİLİŞİ',
                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.black, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 32, color: Colors.white10),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatItem('KALAN_GÜN', '5'),
              _StatItem('BİLETLERİM', '2'),
              _StatItem('TOPLAM_KATILIM', '1.2k'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTicketItem(String name, String date, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                Text(date, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.3))),
              ],
            ),
          ),
          const Icon(Icons.check_circle, color: Colors.emerald, size: 20),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  const _StatItem(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: TextStyle(fontSize: 8, color: Colors.white.withOpacity(0.3), fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.black, color: Colors.white)),
      ],
    );
  }
}
