import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Textarea } from "@/components/ui/textarea"
  import { Question } from "@shared/schema"
  import { useState } from "react"

  interface EditQuestionModalProps {
    isOpen: boolean
    onClose: () => void
    question: Question
  }

  export function EditQuestionModal({ isOpen, onClose, question }: EditQuestionModalProps) {
    const [questionText, setQuestionText] = useState(question.question_text)
    const [options, setOptions] = useState(question.options)
    const [solution, setSolution] = useState(question.solution_text)
    const [comment, setComment] = useState("")
    const [showDisclaimer, setShowDisclaimer] = useState(false)

    const handleSubmit = () => {
      setShowDisclaimer(true)
    }

    const handleConfirmSubmit = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        // Handle not authenticated
        return
      }

      const payload = {
        subject: question.subject,
        suggested_question_text: questionText,
        suggested_options: options,
        suggested_solution: solution,
        comment: comment,
      }

      try {
        const response = await fetch(`/api/questions/${question.qid}/suggest-edit/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (response.ok) {
          // Handle success
          onClose()
        } else {
          // Handle error
        }
      } catch (error) {
        // Handle error
      }
    }

    if (!isOpen) {
      return null
    }

    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg w-1/2">
            <h2 className="text-2xl font-bold mb-4">Suggest an Edit</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="question-text">Question Text</Label>
                <Textarea
                  id="question-text"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
              </div>
              <div>
                <Label>Options</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option.option_text}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index].option_text = e.target.value
                        setOptions(newOptions)
                      }}
                    />
                    <input
                      type="checkbox"
                      checked={option.is_correct}
                      onChange={(e) => {
                        const newOptions = options.map((opt, i) => ({
                          ...opt,
                          is_correct: i === index ? e.target.checked : false,
                        }))
                        setOptions(newOptions)
                      }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="solution">Solution</Label>
                <Textarea
                  id="solution"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explain why you are suggesting this change."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </div>

        {showDisclaimer && (
          <AlertDialog open onOpenChange={() => setShowDisclaimer(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your suggested changes will be submitted for review by our team. Are you sure you
                  want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSubmit}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </>
    )
  }
