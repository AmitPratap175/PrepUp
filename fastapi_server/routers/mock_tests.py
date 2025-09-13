from fastapi import APIRouter, HTTPException
from typing import List

from .. import schemas
from ..storage import storage_instance

router = APIRouter()

@router.get("/", response_model=List[schemas.PracticeTest])
def read_mock_tests():
    return storage_instance.get_mock_tests()

@router.get("/{test_id}", response_model=schemas.PracticeTest)
def read_mock_test(test_id: str):
    test = storage_instance.get_mock_test(test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Mock test not found")
    return test
