import React, { useState } from 'react';
import { Question, SubjectType } from '../types/Question'; // Assuming the types file will be created
import { useAuth } from '@/contexts/auth-context'; // To get the auth token

const AddQuestionPage: React.FC = () => {
  const { token } = useAuth();
  const [examType, setExamType] = useState('cat'); // Default value
  const [subject, setSubject] = useState('');
  const [qid, setQid] = useState('');
  const [passageText, setPassageText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [solutionText, setSolutionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fullMarkdown, setFullMarkdown] = useState('');
  const [isOptionsDisabled, setIsOptionsDisabled] = useState(false);
  const [correctOptionData, setCorrectOptionData] = useState('');
  const [message, setMessage] = useState('');

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 1) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctOptionIndex >= newOptions.length) {
        setCorrectOptionIndex(newOptions.length - 1);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const finalImageUrl = imageUrl.split(',').map(url => url.trim()).filter(url => url);

    const newQuestion: Omit<Question, 'qid'> & { qid?: string } = {
      passage_text: passageText || null,
      question_text: questionText,
      options: isOptionsDisabled ? [] : options.map((opt, i) => ({
        data_option: (i + 1).toString(),
        label: String.fromCharCode(65 + i),
        option_text: opt,
        is_correct: i === correctOptionIndex,
      })),
      correct_option_data: isOptionsDisabled ? correctOptionData : (correctOptionIndex + 1).toString(),
      solution_text: solutionText || null,
      image_url: finalImageUrl.length === 0 ? null : (finalImageUrl.length === 1 ? finalImageUrl[0] : finalImageUrl),
      full_markdown: fullMarkdown,
    };

    if (qid) {
        newQuestion.qid = qid;
    }

    try {
      const response = await fetch('/api/questions/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Assuming Bearer token auth
        },
        body: JSON.stringify({
          examType,
          subject,
          question: newQuestion,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessage(`Success: ${result.message}`);
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to add question:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-3xl w-full mx-auto my-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Add New Question</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 dark:text-gray-300">Exam Type</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                <option value="cat">CAT</option>
                <option value="gate">GATE</option>
              </select>
            </div>
             <div>
              <label className="block mb-2 text-gray-700 dark:text-gray-300">Subject*</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" placeholder="e.g., quantitative-aptitude" required />
            </div>
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Passage (optional)</label>
            <textarea value={passageText} onChange={(e) => setPassageText(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" rows={3}></textarea>
          </div>

          <div className="mt-4">
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Question Text*</label>
            <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" rows={3} required></textarea>
          </div>

          <div className="mt-4">
            <label className="flex items-center text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={isOptionsDisabled} onChange={() => setIsOptionsDisabled(!isOptionsDisabled)} className="mr-2" />
              Provide correct answer directly (no options)
            </label>
          </div>

          {isOptionsDisabled ? (
            <div className="mt-4">
              <label className="block mb-2 text-gray-700 dark:text-gray-300">Correct Answer Data*</label>
              <input type="text" value={correctOptionData} onChange={(e) => setCorrectOptionData(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" required />
            </div>
          ) : (
            <div className="mt-4">
              <label className="block mb-2 text-gray-700 dark:text-gray-300">Options*</label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input type="radio" name="correctOption" checked={correctOptionIndex === index} onChange={() => setCorrectOptionIndex(index)} className="mr-2" />
                  <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + index)}`} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" required />
                  <button type="button" onClick={() => handleRemoveOption(index)} className="ml-2 px-2 py-1 bg-red-600 rounded text-white">-</button>
                </div>
              ))}
              <button type="button" onClick={handleAddOption} className="mt-2 px-4 py-2 bg-green-600 rounded text-white">Add Option</button>
            </div>
          )}

          <div className="mt-4">
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Solution (optional)</label>
            <textarea value={solutionText} onChange={(e) => setSolutionText(e.target.value)} className="w-full p-2 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600" rows={3}></textarea>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Add Question</button>
          </div>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default AddQuestionPage;
