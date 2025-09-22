import React, { useState } from 'react';
import { Question, SubjectType } from '../types/Question';

interface AddQuestionModalProps {
  onClose: () => void;
  onAddQuestion: (subject: SubjectType, question: Question) => Promise<void>;
  subjects: SubjectType[];
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ onClose, onAddQuestion, subjects }) => {
  const [subject, setSubject] = useState<SubjectType>(subjects[0] || '');
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

    const finalImageUrl = imageUrl.split(',').map(url => url.trim()).filter(url => url);

    const newQuestion: Question = {
      qid: qid || `custom-${Date.now()}`,
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

    try {
      await onAddQuestion(subject, newQuestion);
      onClose();
    } catch (error) {
      console.error('Failed to add question:', error);
      alert('Failed to add question. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add New Question</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Subject</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectType)} className="w-full p-2 rounded bg-gray-700">
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">QID (optional)</label>
              <input type="text" value={qid} onChange={(e) => setQid(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
            </div>
          </div>

          <div className="mt-4">
            <label className="block mb-2">Passage (optional)</label>
            <textarea value={passageText} onChange={(e) => setPassageText(e.target.value)} className="w-full p-2 rounded bg-gray-700" rows={3}></textarea>
          </div>

          <div className="mt-4">
            <label className="block mb-2">Question Text*</label>
            <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full p-2 rounded bg-gray-700" rows={3} required></textarea>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input type="checkbox" checked={isOptionsDisabled} onChange={() => setIsOptionsDisabled(!isOptionsDisabled)} className="mr-2" />
              Provide correct answer directly (no options)
            </label>
          </div>

          {isOptionsDisabled ? (
            <div className="mt-4">
              <label className="block mb-2">Correct Answer Data*</label>
              <input type="text" value={correctOptionData} onChange={(e) => setCorrectOptionData(e.target.value)} className="w-full p-2 rounded bg-gray-700" required />
            </div>
          ) : (
            <div className="mt-4">
              <label className="block mb-2">Options*</label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input type="radio" name="correctOption" checked={correctOptionIndex === index} onChange={() => setCorrectOptionIndex(index)} className="mr-2" />
                  <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + index)}`} className="w-full p-2 rounded bg-gray-700" required />
                  <button type="button" onClick={() => handleRemoveOption(index)} className="ml-2 px-2 py-1 bg-red-600 rounded text-white">-</button>
                </div>
              ))}
              <button type="button" onClick={handleAddOption} className="mt-2 px-4 py-2 bg-green-600 rounded text-white">Add Option</button>
            </div>
          )}

          <div className="mt-4">
            <label className="block mb-2">Solution (optional)</label>
            <textarea value={solutionText} onChange={(e) => setSolutionText(e.target.value)} className="w-full p-2 rounded bg-gray-700" rows={3}></textarea>
          </div>

          <div className="mt-4">
            <label className="block mb-2">Image URLs (optional, comma-separated)</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2 rounded bg-gray-700" />
          </div>

          <div className="mt-4">
            <label className="block mb-2">Full Markdown (optional)</label>
            <textarea value={fullMarkdown} onChange={(e) => setFullMarkdown(e.target.value)} className="w-full p-2 rounded bg-gray-700" rows={3}></textarea>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500">Add Question</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionModal;
