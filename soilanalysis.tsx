import React, { useState } from 'react';
import './SoilAnalysis.css';

interface AnalysisResult {
  recommendations: string;
}

const SoilAnalysisApp: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid PDF file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Create form data to send the file
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/analyze-soil-report', {
        method: 'POST',
        body: formData,
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          // Try to parse error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to analyze soil report';
        } catch (parseError) {
          // If parsing fails, use the raw error text
          errorMessage = errorText || 'Failed to analyze soil report';
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      setResult({
        recommendations: data.recommendations
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="soil-analysis-container">
      <h1 className="soil-analysis-title">Soil Report Analysis Tool</h1>
      
      <form onSubmit={handleSubmit} className="soil-analysis-form">
        <div className="form-group">
          <label htmlFor="pdfUpload" className="form-label">
            Upload Soil Report (PDF)
          </label>
          <input
            type="file"
            id="pdfUpload"
            accept="application/pdf"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
        
        <button
          type="submit"
          disabled={!file || isLoading}
          className={`submit-button ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Soil Report'}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="analysis-results">
          <div className="recommendations-section">
            <h2 className="section-title">Recommendations</h2>
            <div className="recommendations-container">
              <div dangerouslySetInnerHTML={{
                __html: result.recommendations
                  .replace(/\*\*/g, '') // Remove bold markdown
                  .replace(/##/g, '') // Remove heading markdown
                  .replace(/\*/g, '•') // Replace asterisks with bullet points
                  .replace(/\n/g, '<br>') // Replace newlines with HTML breaks
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoilAnalysisApp;