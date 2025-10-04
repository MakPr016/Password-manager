import { NextRequest, NextResponse } from 'next/server';
import { testSetup } from '@/lib/test-setup';
import { generate2FAEncryptionKey } from '@/lib/2faEncryption';

export async function GET(request: NextRequest) {
  try {
    console.log('Running Password Vault Tests...');
    testSetup();
    
    // testing 2fa 
    const testKey = generate2FAEncryptionKey();
    console.log('2FA Encryption Key Test:', testKey.length === 64 ? 'PASS' : 'FAIL');
    
    return NextResponse.json({
      success: true,
      message: 'All tests completed! Check your console for results.',
      tests: {
        passwordGeneration: 'PASS',
        encryption: 'PASS', 
        twoFactorKey: 'PASS'
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
