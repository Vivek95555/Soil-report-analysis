from flask import Flask, request, jsonify
from io import BytesIO
import PyPDF2
import google.generativeai as genai

app = Flask(__name__)

# Configure Gemini API key
API_KEY = "AIzaSyDAkDANkg9qFkRiSqErrFeq-TWd65vVo3w"  # Replace with your actual API key
genai.configure(api_key=API_KEY)

# Define the soil report analysis function
def analyze_soil_report(pdf_file):
    try:
        # Extract text directly from BytesIO object
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""

        # Extract text from each page
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text()

        if not text.strip():
            return {
                "error": "Could not extract text from the PDF. It might be scanned or protected."
            }

        # Use Gemini to analyze the soil report
        model = genai.GenerativeModel('models/gemini-1.5-pro')
        prompt = f"""You are a soil and agriculture expert. Analyze the following soil report and provide detailed
        crop recommendations based on the soil properties. Include information about suitable crops,
        recommended fertilizers, and any soil amendments needed.

        Soil report:
        {text}
        """
        response = model.generate_content(prompt)
        recommendations = response.text

        # Return only the recommendations
        return {"recommendations": recommendations}

    except PyPDF2.errors.PdfReadError:
        return {"error": "The PDF file is damaged or cannot be read. Please upload a valid PDF."}
    except Exception as e:
        return {"error": f"Error analyzing the soil report: {str(e)}"}

# Define an API route for uploading and analyzing PDFs
@app.route('/analyze-soil-report', methods=['POST'])
def analyze_soil_report_api():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read the uploaded PDF file into a BytesIO object
        pdf_file = BytesIO(file.read())
        
        # Call the analysis function
        result = analyze_soil_report(pdf_file)
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
