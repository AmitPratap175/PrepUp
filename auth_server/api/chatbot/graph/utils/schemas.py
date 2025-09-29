from pydantic import BaseModel, Field

class RouterResponse(BaseModel):
    response_type: str = Field(
        description="The response type to give to the user. It must be one of: 'conversation', 'image' or 'audio'"
    )


class RagRouter(BaseModel):
    """
    Determines whether a query requires Retrieval-Augmented Generation (RAG)
    or can be answered directly from memory or conversation history.
    """

    requires_rag: bool = Field(
        ...,
        description="Set to True if the query requires information from documents, otherwise set to False.",
    )


class AnswerEvaluator(BaseModel):
    """
    Evaluates the candidate answer and decides if it is sufficient to answer the user's query.
    """

    is_sufficient: bool = Field(
        ...,
        description="Set to True if the answer is sufficient, otherwise set to False.",
    )
    corrected_query: str = Field(
        ...,
        description="The corrected query to be used for the next iteration of the RAG loop.",
    )
