import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/hive_storage.dart';

const String _qrPrefix = 'mastchieve:qr:v1:';

class QrLoginScreen extends ConsumerStatefulWidget {
  const QrLoginScreen({super.key});

  @override
  ConsumerState<QrLoginScreen> createState() => _QrLoginScreenState();
}

class _QrLoginScreenState extends ConsumerState<QrLoginScreen> {
  final _controller = MobileScannerController();
  bool _handled = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handled) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null || !raw.startsWith(_qrPrefix)) return;

    _handled = true;
    setState(() { _loading = true; _error = null; });
    await _controller.stop();

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post('/auth/qr-login', data: {'token': raw});

      final data = response.data['data'];
      await HiveStorage.saveTokens(data['accessToken'], data['refreshToken']);
      await HiveStorage.saveUser(Map<String, dynamic>.from(data['user']));

      if (mounted) context.go('/dashboard');
    } catch (e) {
      setState(() { _error = 'Código QR inválido ou revogado.'; });
      _handled = false;
      await _controller.start();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
        title: const Text('Entrar com código QR'),
      ),
      body: Stack(
        children: [
          MobileScanner(controller: _controller, onDetect: _onDetect),
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withOpacity(0.8), width: 2),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 40,
            child: Column(
              children: [
                const Text(
                  'Aponta a câmara para o código QR de acesso do atleta',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
                if (_loading) ...[
                  const SizedBox(height: 16),
                  const CircularProgressIndicator(color: Colors.white),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: const Color(0xFFDC2626), borderRadius: BorderRadius.circular(8)),
                    child: Text(_error!, style: const TextStyle(color: Colors.white, fontSize: 13)),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
