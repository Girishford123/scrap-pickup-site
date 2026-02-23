import { NextRequest, NextResponse } from 'next/server';

// Mock database (in production, use a real database)
let requests: any[] = [];

export async function GET() {
  return NextResponse.json({ success: true, data: requests });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const newRequest = {
      id: Date.now().toString(),
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    requests.push(newRequest);
    
    return NextResponse.json({ success: true, data: newRequest });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    const index = requests.findIndex(req => req.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }
    
    requests[index] = { ...requests[index], ...updates };
    
    return NextResponse.json({ success: true, data: requests[index] });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}