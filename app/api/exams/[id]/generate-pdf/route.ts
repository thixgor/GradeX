import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { generateExamPDF } from '@/lib/pdf-generator'

// GET - Gerar PDF da prova
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()

    // Apenas admin pode gerar PDF da prova
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })

    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Gerar PDF
    const pdfBuffer = await generateExamPDF(exam)

    // Retornar PDF como download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(exam.name)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate PDF error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar PDF' },
      { status: 500 }
    )
  }
}
