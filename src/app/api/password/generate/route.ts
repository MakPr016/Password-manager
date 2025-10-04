import { NextRequest, NextResponse } from 'next/server';
import { generatePassword, calculatePasswordStrength, getPasswordStrengthLabel } from '@/lib/passwordUtils';
import type { PasswordOptions } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: PasswordOptions = await request.json();

    const { length, uppercase, lowercase, numbers, symbols, excludeSimilar } = body;

    if (!length || length < 4 || length > 128) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password length must be between 4 and 128 characters'
        },
        { status: 400 }
      );
    }

    if (!uppercase && !lowercase && !numbers && !symbols) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one character type must be selected'
        },
        { status: 400 }
      );
    }

    const password = generatePassword(body);
    const strength = calculatePasswordStrength(password);
    const strengthLabel = getPasswordStrengthLabel(strength);

    return NextResponse.json({
      success: true,
      data: {
        password,
        strength,
        strengthLabel,
        length: password.length,
        options: body
      }
    });

  } catch (error) {
    console.error('Password generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate password'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const length = parseInt(searchParams.get('length') || '16');
    const uppercase = searchParams.get('uppercase') !== 'false';
    const lowercase = searchParams.get('lowercase') !== 'false';
    const numbers = searchParams.get('numbers') !== 'false';
    const symbols = searchParams.get('symbols') !== 'false';
    const excludeSimilar = searchParams.get('excludeSimilar') !== 'false';

    const options: PasswordOptions = {
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      excludeSimilar
    };

    const password = generatePassword(options);
    const strength = calculatePasswordStrength(password);
    const strengthLabel = getPasswordStrengthLabel(strength);

    return NextResponse.json({
      success: true,
      data: {
        password,
        strength,
        strengthLabel,
        length: password.length,
        options
      }
    });

  } catch (error) {
    console.error('Password generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate password'
      },
      { status: 500 }
    );
  }
}
