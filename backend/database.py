import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Service for managing persistent data storage for farm data, health metrics, and historical tracking.
    """
    
    def __init__(self, db_path: str = "farm_data.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Farm areas table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS farm_areas (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        crop_type TEXT NOT NULL,
                        area REAL NOT NULL,
                        latitude REAL NOT NULL,
                        longitude REAL NOT NULL,
                        planting_date TEXT,
                        expected_harvest TEXT,
                        health_status TEXT NOT NULL,
                        ndvi_value REAL,
                        last_assessment TEXT,
                        notes TEXT,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                ''')
                
                # Health assessments table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS health_assessments (
                        id TEXT PRIMARY KEY,
                        area_id TEXT NOT NULL,
                        assessment_date TEXT NOT NULL,
                        health_status TEXT NOT NULL,
                        ndvi_value REAL,
                        confidence REAL,
                        predicted_issue TEXT,
                        recommended_action TEXT,
                        severity TEXT,
                        notes TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (area_id) REFERENCES farm_areas (id)
                    )
                ''')
                
                # NDVI history table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS ndvi_history (
                        id TEXT PRIMARY KEY,
                        area_id TEXT NOT NULL,
                        measurement_date TEXT NOT NULL,
                        ndvi_value REAL NOT NULL,
                        source TEXT NOT NULL,
                        notes TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (area_id) REFERENCES farm_areas (id)
                    )
                ''')
                
                # Weather data table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS weather_data (
                        id TEXT PRIMARY KEY,
                        area_id TEXT,
                        measurement_date TEXT NOT NULL,
                        temperature REAL,
                        humidity REAL,
                        rainfall REAL,
                        wind_speed REAL,
                        pressure REAL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (area_id) REFERENCES farm_areas (id)
                    )
                ''')
                
                # Drone surveys table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS drone_surveys (
                        id TEXT PRIMARY KEY,
                        survey_name TEXT NOT NULL,
                        survey_date TEXT NOT NULL,
                        orthomosaic_path TEXT,
                        ndvi_path TEXT,
                        processing_time REAL,
                        status TEXT NOT NULL,
                        notes TEXT,
                        created_at TEXT NOT NULL
                    )
                ''')
                
                # Crop predictions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS crop_predictions (
                        id TEXT PRIMARY KEY,
                        area_id TEXT,
                        image_path TEXT,
                        prediction_date TEXT NOT NULL,
                        predicted_class TEXT NOT NULL,
                        confidence REAL NOT NULL,
                        top5_predictions TEXT,
                        notes TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (area_id) REFERENCES farm_areas (id)
                    )
                ''')
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
    
    def create_farm_area(self, area_data: Dict[str, Any]) -> str:
        """Create a new farm area."""
        try:
            area_id = area_data.get('id', f"area_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            now = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO farm_areas (
                        id, name, crop_type, area, latitude, longitude,
                        planting_date, expected_harvest, health_status,
                        ndvi_value, last_assessment, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    area_id,
                    area_data['name'],
                    area_data['crop_type'],
                    area_data['area'],
                    area_data['coordinates']['lat'],
                    area_data['coordinates']['lng'],
                    area_data.get('planting_date'),
                    area_data.get('expected_harvest'),
                    area_data.get('health_status', 'healthy'),
                    area_data.get('ndvi_value'),
                    area_data.get('last_assessment', now),
                    area_data.get('notes'),
                    now,
                    now
                ))
                conn.commit()
                return area_id
                
        except Exception as e:
            logger.error(f"Error creating farm area: {e}")
            raise
    
    def get_farm_areas(self) -> List[Dict[str, Any]]:
        """Get all farm areas."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM farm_areas ORDER BY created_at DESC')
                rows = cursor.fetchall()
                
                areas = []
                for row in rows:
                    areas.append({
                        'id': row[0],
                        'name': row[1],
                        'crop_type': row[2],
                        'area': row[3],
                        'coordinates': {'lat': row[4], 'lng': row[5]},
                        'planting_date': row[6],
                        'expected_harvest': row[7],
                        'health_status': row[8],
                        'ndvi_value': row[9],
                        'last_assessment': row[10],
                        'notes': row[11],
                        'created_at': row[12],
                        'updated_at': row[13]
                    })
                
                return areas
                
        except Exception as e:
            logger.error(f"Error getting farm areas: {e}")
            return []
    
    def update_farm_area(self, area_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a farm area."""
        try:
            now = datetime.now().isoformat()
            update_data['updated_at'] = now
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Build dynamic update query
                set_clauses = []
                values = []
                
                for key, value in update_data.items():
                    if key != 'id':
                        set_clauses.append(f"{key} = ?")
                        values.append(value)
                
                values.append(area_id)
                
                query = f"UPDATE farm_areas SET {', '.join(set_clauses)} WHERE id = ?"
                cursor.execute(query, values)
                conn.commit()
                
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Error updating farm area: {e}")
            return False
    
    def delete_farm_area(self, area_id: str) -> bool:
        """Delete a farm area."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('DELETE FROM farm_areas WHERE id = ?', (area_id,))
                conn.commit()
                return cursor.rowcount > 0
                
        except Exception as e:
            logger.error(f"Error deleting farm area: {e}")
            return False
    
    def create_health_assessment(self, assessment_data: Dict[str, Any]) -> str:
        """Create a new health assessment."""
        try:
            assessment_id = assessment_data.get('id', f"assessment_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            now = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO health_assessments (
                        id, area_id, assessment_date, health_status, ndvi_value,
                        confidence, predicted_issue, recommended_action, severity, notes, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    assessment_id,
                    assessment_data['area_id'],
                    assessment_data.get('assessment_date', now),
                    assessment_data['health_status'],
                    assessment_data.get('ndvi_value'),
                    assessment_data.get('confidence'),
                    assessment_data.get('predicted_issue'),
                    assessment_data.get('recommended_action'),
                    assessment_data.get('severity'),
                    assessment_data.get('notes'),
                    now
                ))
                conn.commit()
                return assessment_id
                
        except Exception as e:
            logger.error(f"Error creating health assessment: {e}")
            raise
    
    def get_health_assessments(self, area_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get health assessments, optionally filtered by area."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                if area_id:
                    cursor.execute('SELECT * FROM health_assessments WHERE area_id = ? ORDER BY assessment_date DESC', (area_id,))
                else:
                    cursor.execute('SELECT * FROM health_assessments ORDER BY assessment_date DESC')
                
                rows = cursor.fetchall()
                
                assessments = []
                for row in rows:
                    assessments.append({
                        'id': row[0],
                        'area_id': row[1],
                        'assessment_date': row[2],
                        'health_status': row[3],
                        'ndvi_value': row[4],
                        'confidence': row[5],
                        'predicted_issue': row[6],
                        'recommended_action': row[7],
                        'severity': row[8],
                        'notes': row[9],
                        'created_at': row[10]
                    })
                
                return assessments
                
        except Exception as e:
            logger.error(f"Error getting health assessments: {e}")
            return []
    
    def create_ndvi_measurement(self, measurement_data: Dict[str, Any]) -> str:
        """Create a new NDVI measurement."""
        try:
            measurement_id = measurement_data.get('id', f"ndvi_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            now = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO ndvi_history (
                        id, area_id, measurement_date, ndvi_value, source, notes, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    measurement_id,
                    measurement_data['area_id'],
                    measurement_data.get('measurement_date', now),
                    measurement_data['ndvi_value'],
                    measurement_data.get('source', 'manual'),
                    measurement_data.get('notes'),
                    now
                ))
                conn.commit()
                return measurement_id
                
        except Exception as e:
            logger.error(f"Error creating NDVI measurement: {e}")
            raise
    
    def get_ndvi_history(self, area_id: str, days: int = 30) -> List[Dict[str, Any]]:
        """Get NDVI history for an area."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT * FROM ndvi_history 
                    WHERE area_id = ? 
                    AND measurement_date >= datetime('now', '-{} days')
                    ORDER BY measurement_date ASC
                '''.format(days), (area_id,))
                
                rows = cursor.fetchall()
                
                history = []
                for row in rows:
                    history.append({
                        'id': row[0],
                        'area_id': row[1],
                        'measurement_date': row[2],
                        'ndvi_value': row[3],
                        'source': row[4],
                        'notes': row[5],
                        'created_at': row[6]
                    })
                
                return history
                
        except Exception as e:
            logger.error(f"Error getting NDVI history: {e}")
            return []
    
    def create_drone_survey(self, survey_data: Dict[str, Any]) -> str:
        """Create a new drone survey record."""
        try:
            survey_id = survey_data.get('id', f"survey_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            now = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO drone_surveys (
                        id, survey_name, survey_date, orthomosaic_path, ndvi_path,
                        processing_time, status, notes, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    survey_id,
                    survey_data['survey_name'],
                    survey_data.get('survey_date', now),
                    survey_data.get('orthomosaic_path'),
                    survey_data.get('ndvi_path'),
                    survey_data.get('processing_time'),
                    survey_data.get('status', 'completed'),
                    survey_data.get('notes'),
                    now
                ))
                conn.commit()
                return survey_id
                
        except Exception as e:
            logger.error(f"Error creating drone survey: {e}")
            raise
    
    def get_drone_surveys(self) -> List[Dict[str, Any]]:
        """Get all drone surveys."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, survey_name, survey_date, orthomosaic_path, ndvi_path,
                           processing_time, status, notes, created_at
                    FROM drone_surveys
                    ORDER BY created_at DESC
                ''')
                
                columns = [description[0] for description in cursor.description]
                surveys = []
                
                for row in cursor.fetchall():
                    survey = dict(zip(columns, row))
                    surveys.append(survey)
                
                return surveys
                
        except Exception as e:
            logger.error(f"Error getting drone surveys: {e}")
            return []
    
    def create_crop_prediction(self, prediction_data: Dict[str, Any]) -> str:
        """Create a new crop prediction record."""
        try:
            prediction_id = prediction_data.get('id', f"prediction_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
            now = datetime.now().isoformat()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO crop_predictions (
                        id, area_id, image_path, prediction_date, predicted_class,
                        confidence, top5_predictions, notes, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    prediction_id,
                    prediction_data.get('area_id'),
                    prediction_data.get('image_path'),
                    prediction_data.get('prediction_date', now),
                    prediction_data['predicted_class'],
                    prediction_data['confidence'],
                    json.dumps(prediction_data.get('top5_predictions', [])),
                    prediction_data.get('notes'),
                    now
                ))
                conn.commit()
                return prediction_id
                
        except Exception as e:
            logger.error(f"Error creating crop prediction: {e}")
            raise
    
    def get_farm_statistics(self) -> Dict[str, Any]:
        """Get overall farm statistics."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Total area
                cursor.execute('SELECT SUM(area) FROM farm_areas')
                total_area = cursor.fetchone()[0] or 0
                
                # Health distribution
                cursor.execute('''
                    SELECT health_status, COUNT(*) as count, SUM(area) as total_area
                    FROM farm_areas 
                    GROUP BY health_status
                ''')
                health_distribution = {}
                for row in cursor.fetchall():
                    health_distribution[row[0]] = {
                        'count': row[1],
                        'total_area': row[2]
                    }
                
                # Last assessment
                cursor.execute('SELECT MAX(last_assessment) FROM farm_areas')
                last_assessment = cursor.fetchone()[0] or 'Never'
                
                return {
                    'total_area': total_area,
                    'health_distribution': health_distribution,
                    'last_assessment': last_assessment
                }
                
        except Exception as e:
            logger.error(f"Error getting farm statistics: {e}")
            return {
                'total_area': 0,
                'health_distribution': {},
                'last_assessment': 'Never'
            }
