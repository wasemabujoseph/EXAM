export interface ResourceItem {
  title: string;
  url: string;
  type: 'pdf' | 'exam' | 'note';
  year: string;
}

export interface SubjectResources {
  exams: ResourceItem[];
  pdf: ResourceItem[];
  note: ResourceItem[];
}

export interface SubjectComponent {
  name: string;
  ects_credits: number;
}

export interface Subject {
  name: string;
  ects_credits: number;
  sub: SubjectResources;
  components?: SubjectComponent[];
}

export interface Semester {
  semester: string;
  subjects: Subject[];
  total_ects_credits: number;
}

export interface CurriculumYear {
  year: string;
  semesters: Semester[];
}

export interface Curriculum {
  faculty: string;
  years: CurriculumYear[];
}

export const curriculum: Curriculum = {
  "faculty": "MD Curriculum",
  "years": [
    {
      "year": "I Year",
      "semesters": [
        {
          "semester": "I semester",
          "subjects": [
            {
              "name": "Introduction to Clinical Anatomy 2",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Embryology, Basic Histology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "General Physiology",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Basics of Biochemistry",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Basic Microbiology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Genetics",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Medical Ethics",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Skills - 1",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Foreign Language 2",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        },
        {
          "semester": "II semester",
          "subjects": [
            {
              "name": "Elective - 1",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Introduction to Clinical Anatomy 1",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Medical Chemistry",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Basics of Medical Biophysics",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Cytology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Environmental Health",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Health Promotion",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Medical Informatics",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Research Skills 1",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Foreign Language 1",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 2",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        }
      ]
    },
    {
      "year": "II Year",
      "semesters": [
        {
          "semester": "I semester",
          "subjects": [
            {
              "name": "Nervous System",
              "ects_credits": 13,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Clinical Anatomy",
                  "ects_credits": 5
                },
                {
                  "name": "Histology / Embryology",
                  "ects_credits": 3
                },
                {
                  "name": "Physiology",
                  "ects_credits": 3
                },
                {
                  "name": "Biochemistry",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Cardiovascular System",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Clinical Anatomy",
                  "ects_credits": 1
                },
                {
                  "name": "Histology / Embryology",
                  "ects_credits": 1
                },
                {
                  "name": "Physiology",
                  "ects_credits": 2
                },
                {
                  "name": "Biochemistry",
                  "ects_credits": 1
                }
              ]
            },
            {
              "name": "Molecular Biology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Basic Microbiology, Virology",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Skills - 2 (OSPE)",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 3",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        },
        {
          "semester": "II semester",
          "subjects": [
            {
              "name": "Respiratory System",
              "ects_credits": 6,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Clinical Anatomy",
                  "ects_credits": 3
                },
                {
                  "name": "Histology / Embryology",
                  "ects_credits": 1
                },
                {
                  "name": "Physiology",
                  "ects_credits": 1
                },
                {
                  "name": "Biochemistry",
                  "ects_credits": 1
                }
              ]
            },
            {
              "name": "Digestive System",
              "ects_credits": 8,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Clinical Anatomy",
                  "ects_credits": 2
                },
                {
                  "name": "Histology / Embryology",
                  "ects_credits": 2
                },
                {
                  "name": "Physiology",
                  "ects_credits": 2
                },
                {
                  "name": "Biochemistry",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Urogenital System",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Clinical Anatomy",
                  "ects_credits": 1
                },
                {
                  "name": "Histology / Embryology",
                  "ects_credits": 1
                },
                {
                  "name": "Physiology",
                  "ects_credits": 1
                },
                {
                  "name": "Biochemistry",
                  "ects_credits": 1
                }
              ]
            },
            {
              "name": "Endocrine System and Skin",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Clinical Anatomy",
                  "ects_credits": 1
                },
                {
                  "name": "Histology / Embryology",
                  "ects_credits": 1
                },
                {
                  "name": "Physiology",
                  "ects_credits": 1
                },
                {
                  "name": "Biochemistry",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Immunology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 4",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Behavioral Science",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        }
      ]
    },
    {
      "year": "III Year",
      "semesters": [
        {
          "semester": "I semester",
          "subjects": [
            {
              "name": "Pathology - 2",
              "ects_credits": 8,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Physical Diagnostics - Propedeutics of Internal Diseases - 2",
              "ects_credits": 8,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Medical Radiology - 2",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Pharmacology - 2",
              "ects_credits": 7,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Basics of Clinical Reasoning",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Skills - 3",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        },
        {
          "semester": "II semester",
          "subjects": [
            {
              "name": "Pathology - 1 (General)",
              "ects_credits": 10,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Physical Diagnostics - Propedeutics of Internal Diseases - 1 (General)",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Medical Radiology - 1 (General)",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "General Surgery",
              "ects_credits": 6,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Pharmacology - 1 (General)",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 5",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Research Skills - 2",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        }
      ]
    },
    {
      "year": "IV Course",
      "semesters": [
        {
          "semester": "I semester",
          "subjects": [
            {
              "name": "Internal Medicine Block - 2",
              "ects_credits": 11,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Nephrology",
                  "ects_credits": 2
                },
                {
                  "name": "Rheumatology",
                  "ects_credits": 3
                },
                {
                  "name": "Endocrinology",
                  "ects_credits": 3
                },
                {
                  "name": "Hematology, Transfusiology",
                  "ects_credits": 3
                }
              ]
            },
            {
              "name": "Infectious Diseases and Immunology Block",
              "ects_credits": 11,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Infectious Diseases",
                  "ects_credits": 6
                },
                {
                  "name": "Phtisiology",
                  "ects_credits": 2
                },
                {
                  "name": "Allergology and Clinical Immunology",
                  "ects_credits": 3
                }
              ]
            },
            {
              "name": "Clinical Pharmacology",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 6",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Skills - 4 (OSCE)",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        },
        {
          "semester": "II semester",
          "subjects": [
            {
              "name": "Internal Medicine Block - 1",
              "ects_credits": 11,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Cardiology",
                  "ects_credits": 5
                },
                {
                  "name": "Pulmonology",
                  "ects_credits": 3
                },
                {
                  "name": "Gastroenterology",
                  "ects_credits": 3
                }
              ]
            },
            {
              "name": "Endoscopy",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Surgery - 1",
              "ects_credits": 9,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Medical Psychology",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Public Health",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Research Skills - 3",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        }
      ]
    },
    {
      "year": "V Course",
      "semesters": [
        {
          "semester": "I semester",
          "subjects": [
            {
              "name": "Neurology and Neurosurgery",
              "ects_credits": 8,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Neurology",
                  "ects_credits": 6
                },
                {
                  "name": "Neurosurgery",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Internal Medicine Block - 3",
              "ects_credits": 7,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Differential Diagnosis of Internal Diseases (OSCE)",
                  "ects_credits": 7
                }
              ]
            },
            {
              "name": "Epidemiology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Surgery - 2",
              "ects_credits": 8,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Urology",
                  "ects_credits": 4
                },
                {
                  "name": "Traumatology, Orthopedics",
                  "ects_credits": 4
                }
              ]
            },
            {
              "name": "Research Skills - 4",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        },
        {
          "semester": "II semester",
          "subjects": [
            {
              "name": "Obstetrics-Gynecology Block (OSCE)",
              "ects_credits": 11,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Obstetric",
                  "ects_credits": 5
                },
                {
                  "name": "Gynecology",
                  "ects_credits": 4
                },
                {
                  "name": "Reproductive Medicine",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Pediatrics (OSCE)",
              "ects_credits": 7,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Pediatric Surgery",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Oncology and Palliative Care",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 7",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 8",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Skills - 5 (OSCE)",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        }
      ]
    },
    {
      "year": "VI Course",
      "semesters": [
        {
          "semester": "I semester",
          "subjects": [
            {
              "name": "Family Medicine",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Geriatrics",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Surgery - 3 (Syndrom)",
              "ects_credits": 6,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Dermato-Venereology",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Ophthalmology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Oto-Rhyno-Laryngology",
              "ects_credits": 3,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Laboratory Medicine",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 9",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Elective - 10",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        },
        {
          "semester": "II semester",
          "subjects": [
            {
              "name": "Emergency Medicine Block",
              "ects_credits": 11,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              },
              "components": [
                {
                  "name": "Medical Emergencies",
                  "ects_credits": 5
                },
                {
                  "name": "Anesthesiology, Intensive Care",
                  "ects_credits": 4
                },
                {
                  "name": "Clinical Toxicology",
                  "ects_credits": 2
                }
              ]
            },
            {
              "name": "Psychiatry",
              "ects_credits": 5,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Fundamentals of Medical Rehabilitation",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Forensic Medicine",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Research Skills - 5",
              "ects_credits": 2,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Clerkship - Elective - 11 (MiniCEX)",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            },
            {
              "name": "Clinical Clerkship - Elective - 12 (MiniCEX)",
              "ects_credits": 4,
              "sub": {
                "exams": [],
                "pdf": [],
                "note": []
              }
            }
          ],
          "total_ects_credits": 30
        }
      ]
    }
  ]
};
